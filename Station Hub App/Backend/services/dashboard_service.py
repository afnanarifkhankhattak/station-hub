from fastapi import HTTPException
from config.firebase import db
from datetime import datetime
import httpx

# Shared HTTP client for push notifications — avoids creating a new
# TCP connection on every booking status update.
_push_client = httpx.Client(timeout=10.0)


def get_dashboard_stats(user_id: str) -> dict:
    # ── Fetch only this owner's stations ──────────────────
    stations_docs = list(db.collection("stations").where("owner_id", "==", user_id).stream())
    station_ids = [d.id for d in stations_docs]
    station_names = {d.id: d.to_dict().get("name", "") for d in stations_docs}

    # ── Fetch only bookings for this owner's stations ─────
    if station_ids:
        bookings_docs = []
        # Firestore 'in' query supports max 30 items at a time
        for i in range(0, len(station_ids), 30):
            chunk = station_ids[i:i+30]
            docs = list(db.collection("bookings").where("station_id", "in", chunk).stream())
            bookings_docs.extend(docs)
    else:
        bookings_docs = []

    # ── Count users via aggregation (instead of streaming entire collection) ─
    try:
        count_result = db.collection("users").count().get()
        total_users = count_result[0][0].value
    except Exception:
        # Fallback for older SDK versions without count()
        total_users = len(list(db.collection("users").select([]).stream()))

    bookings = [{"id": d.id, **d.to_dict()} for d in bookings_docs]
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # ── Bulk-fetch all referenced users and services ──────
    # Collect unique IDs across ALL bookings (one pass)
    user_ids = list({b.get("user_id") for b in bookings if b.get("user_id")})
    service_ids = list({b.get("service_id") for b in bookings if b.get("service_id")})

    # Batch fetch in 2 network calls total (instead of 2×N)
    users_map = {}
    if user_ids:
        user_refs = [db.collection("users").document(uid) for uid in user_ids]
        for doc in db.get_all(user_refs):
            if doc.exists:
                users_map[doc.id] = doc.to_dict()

    services_map = {}
    if service_ids:
        svc_refs = [db.collection("services").document(sid) for sid in service_ids]
        for doc in db.get_all(svc_refs):
            if doc.exists:
                services_map[doc.id] = doc.to_dict()

    # ── Helper: get price from pre-fetched services map ───
    def _get_price_fast(b: dict) -> float:
        sid = b.get("service_id")
        tier = b.get("tier")
        if not sid or not tier:
            return 0.0
        svc = services_map.get(sid)
        if not svc:
            return 0.0
        tiers = svc.get("tiers") or {}
        tier_data = tiers.get(tier)
        if not tier_data:
            return 0.0
        return float(tier_data.get("price", 0) or 0)

    # ── Helper: format booking from pre-fetched maps ──────
    def _fmt_fast(b: dict) -> dict:
        user_data = users_map.get(b.get("user_id"), {})
        service_data = services_map.get(b.get("service_id"), {})

        return {
            "id":             b.get("id", ""),
            "user_name":      user_data.get("full_name", "Unknown"),
            "user_profile_image": user_data.get("profile_image", ""),
            "service_id":     b.get("service_id", ""),
            "service_name":   service_data.get("name", ""),
            "station_name":   station_names.get(b.get("station_id", ""), ""),
            "tier":           b.get("tier", ""),
            "travel_date":    b.get("travel_date", ""),
            "travel_time":    b.get("travel_time", ""),
            "vehicle_type":   b.get("vehicle_type", ""),
            "vehicle_brand":  b.get("vehicle_brand", ""),
            "vehicle_number": b.get("vehicle_number", ""),
            "special_request": b.get("special_request", ""),
            "price":          _get_price_fast(b),
            "status":         b.get("status", ""),
            "created_at":     b.get("created_at", ""),
        }

    # ── Stats ──────────────────────────────────────────────
    total_bookings = len(bookings)
    total_stations = len(stations_docs)

    todays_earnings = sum(
        _get_price_fast(b)
        for b in bookings
        if b.get("status") == "completed"
        and str(b.get("travel_date", "")).startswith(today)
    )

    # ── Pending bookings ───────────────────────────────────
    pending_bookings = [
        _fmt_fast(b) for b in bookings
        if b.get("status") == "pending"
    ]

    # ── Confirmed bookings ─────────────────────────────────
    confirmed_bookings = [
        _fmt_fast(b) for b in bookings
        if b.get("status") == "confirmed"
    ]

    # ── Recent 10 bookings ─────────────────────────────────
    sorted_bookings = sorted(
        bookings,
        key=lambda b: b.get("created_at", ""),
        reverse=True
    )
    recent_bookings = [_fmt_fast(b) for b in sorted_bookings[:10]]

    return {
        "stats": {
            "total_bookings":  total_bookings,
            "total_stations":  total_stations,
            "total_users":     total_users,
            "todays_earnings": todays_earnings,
        },
        "pending_bookings":   pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "recent_bookings":    recent_bookings,
    }


def update_booking_status(booking_id: str, status: str) -> dict:
    allowed = {"confirmed", "rejected", "completed", "cancelled"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed}")

    doc_ref = db.collection("bookings").document(booking_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    doc_ref.update({"status": status})

    # Send push notification to customer
    try:
        booking = doc.to_dict()
        user_id = booking.get("user_id")
        if user_id:
            user_doc = db.collection("users").document(user_id).get()
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
                        }
                    )
    except Exception as e:
        print(f"Push notification error: {e}")

    return {"message": f"Booking marked as {status}", "booking_id": booking_id}