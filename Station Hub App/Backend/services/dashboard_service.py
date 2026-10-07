from fastapi import HTTPException
from config.firebase import db
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time
import httpx
from services.booking_events import booking_events

# Shared HTTP client for push notifications — avoids creating a new
# TCP connection on every booking status update.
_push_client = httpx.Client(timeout=10.0)

# Shared pool for overlapping independent Firestore RPCs inside one request.
_IO_POOL = ThreadPoolExecutor(max_workers=8, thread_name_prefix="dashboard-io")

# Global user count is owner-independent; accept up to 60s of staleness.
_USER_COUNT_TTL_SECONDS = 60.0
_user_count_lock = threading.Lock()
_user_count_cache = {"value": None, "expires_at": 0.0}

_FIRESTORE_IN_LIMIT = 30


def _resolve_price(service: dict, booking: dict) -> float:
    """Resolve price from a service doc for a given booking.

    Priority:
      1. New path: booking.car_category  + service.categories[cat].price
      2. Legacy path: booking.tier       + service.tiers[tier].price
      3. Fallback: service.price (very old seed data)
    """
    # 1. car_category → categories
    category = booking.get("car_category")
    if category:
        cat_data = (service.get("categories") or {}).get(category)
        if cat_data and cat_data.get("price") is not None:
            return float(cat_data["price"])

    # 2. tier → tiers (legacy shape, may be flat or nested)
    tier = booking.get("tier")
    if tier:
        tier_data = (service.get("tiers") or {}).get(tier)
        if tier_data:
            if tier_data.get("price") is not None:
                return float(tier_data["price"])
            nested = (tier_data.get("base") or tier_data.get("premium") or {})
            if nested.get("price") is not None:
                return float(nested["price"])

    # 3. Very old top-level price field (seed data)
    if service.get("price") is not None:
        return float(service["price"])

    return 0.0


def _get_total_users_cached() -> int:
    """Return global users count, refreshing at most once per TTL window."""
    now = time.monotonic()
    with _user_count_lock:
        cached = _user_count_cache["value"]
        if cached is not None and now < _user_count_cache["expires_at"]:
            return cached

    count_result = db.collection("users").count().get()
    total = int(count_result[0][0].value)

    with _user_count_lock:
        _user_count_cache["value"] = total
        _user_count_cache["expires_at"] = time.monotonic() + _USER_COUNT_TTL_SECONDS
    return total


def _fetch_owner_stations(user_id: str) -> list:
    return list(
        db.collection("stations").where("owner_id", "==", user_id).stream()
    )


def _station_chunks(station_ids: list) -> list:
    return [
        station_ids[i : i + _FIRESTORE_IN_LIMIT]
        for i in range(0, len(station_ids), _FIRESTORE_IN_LIMIT)
    ]


def _run_chunked(station_ids: list, fn) -> list:
    """Run fn(chunk) over station_id chunks; parallel when >1 chunk."""
    if not station_ids:
        return []
    chunks = _station_chunks(station_ids)
    if len(chunks) == 1:
        return fn(chunks[0])
    out = []
    futures = [_IO_POOL.submit(fn, c) for c in chunks]
    for fut in as_completed(futures):
        out.extend(fut.result())
    return out


def _docs_to_bookings(docs) -> list:
    return [{"id": d.id, **(d.to_dict() or {})} for d in docs]


def _fetch_by_status(station_ids: list, status: str) -> list:
    def q(chunk):
        return _docs_to_bookings(
            db.collection("bookings")
            .where("station_id", "in", chunk)
            .where("status", "==", status)
            .stream()
        )
    return _run_chunked(station_ids, q)


def _count_bookings(station_ids: list) -> int:
    def q(chunk):
        return [
            int(
                db.collection("bookings")
                .where("station_id", "in", chunk)
                .count()
                .get()[0][0]
                .value
            )
        ]
    return sum(_run_chunked(station_ids, q))


def _fetch_completed_on_date(station_ids: list, day: str) -> list:
    def q(chunk):
        return _docs_to_bookings(
            db.collection("bookings")
            .where("station_id", "in", chunk)
            .where("status", "==", "completed")
            .where("travel_date", "==", day)
            .stream()
        )
    return _run_chunked(station_ids, q)


def _fetch_recent(station_ids: list, limit: int = 10) -> list:
    def q(chunk):
        return _docs_to_bookings(
            db.collection("bookings")
            .where("station_id", "in", chunk)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
    merged = _run_chunked(station_ids, q)
    merged.sort(key=lambda b: b.get("created_at", ""), reverse=True)
    return merged[:limit]


# Short TTL so rapid dashboard refreshes don't re-hit Firestore.
_DASH_TTL = 15.0
_dash_lock = threading.Lock()
_dash_cache: dict = {}


def _batch_get_users_and_services(user_ids: list, service_ids: list) -> tuple:
    """One get_all for mixed user+service refs (single RTT). Skips entirely if both empty."""
    if not user_ids and not service_ids:
        return {}, {}

    refs = [db.collection("users").document(uid) for uid in user_ids]
    refs += [db.collection("services").document(sid) for sid in service_ids]

    users_map = {}
    services_map = {}
    for doc in db.get_all(refs):
        if not doc.exists:
            continue
        col = doc.reference.parent.id
        if col == "users":
            users_map[doc.id] = doc.to_dict()
        elif col == "services":
            services_map[doc.id] = doc.to_dict()
    return users_map, services_map


def get_dashboard_stats(user_id: str) -> dict:
    """Dashboard stats — no full booking dump.

    Loads only: pending, confirmed, recent(10), completed-today; count() for totals.
    15s per-owner TTL for rapid refresh.
    """
    now = time.monotonic()
    with _dash_lock:
        hit = _dash_cache.get(user_id)
        if hit and now < hit["exp"]:
            return hit["data"]

    with _user_count_lock:
        count_is_warm = (
            _user_count_cache["value"] is not None
            and now < _user_count_cache["expires_at"]
        )

    fut_count = None
    if count_is_warm:
        total_users = _get_total_users_cached()
    else:
        fut_count = _IO_POOL.submit(_get_total_users_cached)

    stations_docs = _fetch_owner_stations(user_id)
    station_ids = [d.id for d in stations_docs]
    station_names = {
        d.id: (d.to_dict() or {}).get("name", "") for d in stations_docs
    }

    if fut_count is not None:
        total_users = fut_count.result()

    if not station_ids:
        empty = {
            "stats": {
                "total_bookings": 0,
                "total_stations": 0,
                "total_users": total_users,
                "todays_earnings": 0.0,
            },
            "pending_bookings": [],
            "confirmed_bookings": [],
            "recent_bookings": [],
        }
        with _dash_lock:
            _dash_cache[user_id] = {"data": empty, "exp": time.monotonic() + _DASH_TTL}
        return empty

    today = datetime.utcnow().strftime("%Y-%m-%d")

    fut_pending = _IO_POOL.submit(_fetch_by_status, station_ids, "pending")
    fut_confirmed = _IO_POOL.submit(_fetch_by_status, station_ids, "confirmed")
    fut_recent = _IO_POOL.submit(_fetch_recent, station_ids, 10)
    fut_earnings = _IO_POOL.submit(_fetch_completed_on_date, station_ids, today)
    fut_total = _IO_POOL.submit(_count_bookings, station_ids)

    pending = fut_pending.result()
    confirmed = fut_confirmed.result()
    recent = fut_recent.result()
    earnings_related = fut_earnings.result()
    total_bookings = fut_total.result()

    enrich_bookings = pending + confirmed + recent + earnings_related
    user_ids = list({b.get("user_id") for b in enrich_bookings if b.get("user_id")})
    service_ids = list(
        {b.get("service_id") for b in enrich_bookings if b.get("service_id")}
    )
    users_map, services_map = _batch_get_users_and_services(user_ids, service_ids)

    def _get_price_fast(b: dict) -> float:
        sid = b.get("service_id")
        if not sid:
            return 0.0
        svc = services_map.get(sid)
        if not svc:
            return 0.0
        return _resolve_price(svc, b)

    def _fmt_fast(b: dict) -> dict:
        user_data = users_map.get(b.get("user_id"), {})
        service_data = services_map.get(b.get("service_id"), {})
        return {
            "id": b.get("id", ""),
            "user_name": user_data.get("full_name", "Unknown"),
            "user_profile_image": user_data.get("profile_image", ""),
            "service_id": b.get("service_id", ""),
            "service_name": service_data.get("name", ""),
            "station_name": station_names.get(b.get("station_id", ""), ""),
            "car_category": b.get("car_category", ""),
            "travel_date": b.get("travel_date", ""),
            "travel_time": b.get("travel_time", ""),
            "vehicle_type": b.get("vehicle_type", ""),
            "vehicle_brand": b.get("vehicle_brand", ""),
            "vehicle_number": b.get("vehicle_number", ""),
            "special_request": b.get("special_request", ""),
            "price": _get_price_fast(b),
            "status": b.get("status", ""),
            "created_at": b.get("created_at", ""),
        }

    result = {
        "stats": {
            "total_bookings": total_bookings,
            "total_stations": len(stations_docs),
            "total_users": total_users,
            "todays_earnings": sum(_get_price_fast(b) for b in earnings_related),
        },
        "pending_bookings": [_fmt_fast(b) for b in pending],
        "confirmed_bookings": [_fmt_fast(b) for b in confirmed],
        "recent_bookings": [_fmt_fast(b) for b in recent],
    }
    with _dash_lock:
        _dash_cache[user_id] = {"data": result, "exp": time.monotonic() + _DASH_TTL}
    return result


def update_booking_status(
    booking_id: str,
    status: str,
    user_id: str,
    user_role: str = "user",
) -> dict:
    """
    Update a booking's status.

    Authorization:
      - Super admins can update any booking.
      - Station owners can only update bookings at their own stations.
      - Customers are denied.
    """
    allowed = {"confirmed", "rejected", "completed", "cancelled"}
    if status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {allowed}",
        )

    doc_ref = db.collection("bookings").document(booking_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = doc.to_dict()
    previous_status = booking.get("status")

    # ✅ OWNERSHIP CHECK
    if user_role != "admin":
        station_id = booking.get("station_id")
        if not station_id:
            raise HTTPException(
                status_code=400,
                detail="Booking has no station associated",
            )

        station_doc = db.collection("stations").document(station_id).get()
        if not station_doc.exists:
            raise HTTPException(status_code=404, detail="Station not found")

        station_owner_id = (station_doc.to_dict() or {}).get("owner_id")
        if station_owner_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to update this booking",
            )

    # Idempotent — no-op if status unchanged
    if previous_status == status:
        return {
            "message": f"Booking is already {status}",
            "booking_id": booking_id,
        }

    doc_ref.update({"status": status})
    event = booking_events.publish(booking.get("user_id", ""), booking_id, status)

    # Bust dashboard cache (all owners, cheap)
    with _dash_lock:
        _dash_cache.clear()

    # Send push notification to customer
    try:
        customer_id = booking.get("user_id")
        if customer_id:
            user_doc = db.collection("users").document(customer_id).get()
            if user_doc.exists:
                push_token = user_doc.to_dict().get("push_token")
                if push_token:
                    title_map = {
                        "confirmed": "Booking Confirmed ✅",
                        "rejected":  "Booking Rejected ❌",
                        "completed": "Service Completed 🎉",
                        "cancelled": "Booking Cancelled",
                    }
                    service_name = booking.get("service_name") or "Your service"
                    _push_client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": push_token,
                            "title": title_map.get(status, "Booking Update"),
                            "body": f"{service_name} has been {status}.",
                            "sound": "default",
                            "data": {
                                "booking_id": booking_id,
                                "new_status": status,
                                "timestamp": event["timestamp"],
                            },
                        },
                    )
    except Exception as e:
        print(f"Push notification error: {e}")

    return {
        "message": f"Booking marked as {status}",
        "booking_id": booking_id,
        "event": event,
    }