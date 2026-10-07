"""
Admin-only service layer.

Provides platform-wide aggregations for the Super Admin dashboard.
All functions here assume the caller is already authorized as an admin
(that check happens in the route layer via RoleChecker).
"""
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from config.firebase import db

# Short-lived cache: admin dashboards are refreshed often but counts change slowly.
_STATS_TTL = 30.0
_stats_lock = threading.Lock()
_stats_cache: dict = {"data": None, "expires_at": 0.0}

# Reuse a small pool for parallel count queries (Firestore .count() is cheap but
# each call is a separate RPC — running them in parallel reduces latency).
_IO_POOL = ThreadPoolExecutor(max_workers=6, thread_name_prefix="admin-stats")


def _count(query) -> int:
    """Run a Firestore count aggregation and return the integer value."""
    result = query.count().get()
    return int(result[0][0].value)


# ─── Station counts ─────────────────────────────────────────
def _count_stations_by_status(status: str) -> int:
    return _count(db.collection("stations").where("status", "==", status))


def _count_stations_by_type(station_type: str) -> int:
    return _count(db.collection("stations").where("station_type", "==", station_type))


# ─── User counts ────────────────────────────────────────────
def _count_users_by_role(role: str) -> int:
    return _count(db.collection("users").where("role", "==", role))


# ─── Booking counts ─────────────────────────────────────────
def _count_bookings_by_status(status: str) -> int:
    return _count(db.collection("bookings").where("status", "==", status))


def _count_bookings_today() -> int:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return _count(db.collection("bookings").where("travel_date", "==", today))


# ─── Main entry point — Platform stats ──────────────────────
def get_platform_stats(force_refresh: bool = False) -> dict:
    """
    Aggregate platform-wide statistics.

    Runs independent Firestore count queries in parallel for speed.
    Results are cached for 30 seconds to avoid hammering Firestore when
    the admin refreshes the dashboard repeatedly.
    """
    now = time.monotonic()
    with _stats_lock:
        if not force_refresh and _stats_cache["data"] and now < _stats_cache["expires_at"]:
            return _stats_cache["data"]

    # Submit all count queries to the pool — they'll run concurrently.
    futures = {
        # Stations
        "stations_total": _IO_POOL.submit(_count, db.collection("stations")),
        "stations_approved": _IO_POOL.submit(_count_stations_by_status, "APPROVED"),
        "stations_submitted": _IO_POOL.submit(_count_stations_by_status, "SUBMITTED"),
        "stations_draft": _IO_POOL.submit(_count_stations_by_status, "DRAFT"),
        "stations_rejected": _IO_POOL.submit(_count_stations_by_status, "REJECTED"),
        "stations_suspended": _IO_POOL.submit(_count_stations_by_status, "SUSPENDED"),
        "stations_changes_requested": _IO_POOL.submit(_count_stations_by_status, "CHANGES_REQUESTED"),
        # Station types
        "stations_car_care": _IO_POOL.submit(_count_stations_by_type, "CAR_CARE"),
        "stations_ev": _IO_POOL.submit(_count_stations_by_type, "EV"),
        "stations_hev": _IO_POOL.submit(_count_stations_by_type, "HEV"),
        # Users
        "users_total": _IO_POOL.submit(_count, db.collection("users")),
        "users_customers": _IO_POOL.submit(_count_users_by_role, "user"),
        "users_owners": _IO_POOL.submit(_count_users_by_role, "station_owner"),
        "users_admins": _IO_POOL.submit(_count_users_by_role, "admin"),
        # Bookings
        "bookings_total": _IO_POOL.submit(_count, db.collection("bookings")),
        "bookings_today": _IO_POOL.submit(_count_bookings_today),
        "bookings_pending": _IO_POOL.submit(_count_bookings_by_status, "pending"),
        "bookings_confirmed": _IO_POOL.submit(_count_bookings_by_status, "confirmed"),
        "bookings_completed": _IO_POOL.submit(_count_bookings_by_status, "completed"),
        "bookings_cancelled": _IO_POOL.submit(_count_bookings_by_status, "cancelled"),
    }

    # Collect results (fails gracefully if one query errors).
    results = {}
    for key, fut in futures.items():
        try:
            results[key] = fut.result()
        except Exception as e:
            print(f"[admin_stats] Query '{key}' failed: {e}")
            results[key] = 0

    # Shape the response for the frontend
    data = {
        "stations": {
            "total": results["stations_total"],
            "approved": results["stations_approved"],
            "pending": results["stations_submitted"],
            "draft": results["stations_draft"],
            "rejected": results["stations_rejected"],
            "suspended": results["stations_suspended"],
            "changes_requested": results["stations_changes_requested"],
            "suspended_rejected": results["stations_rejected"] + results["stations_suspended"],
            "car_care": results["stations_car_care"],
            "ev": results["stations_ev"],
            "hev": results["stations_hev"],
        },
        "users": {
            "total": results["users_total"],
            "customers": results["users_customers"],
            "owners": results["users_owners"],
            "admins": results["users_admins"],
        },
        "bookings": {
            "total": results["bookings_total"],
            "today": results["bookings_today"],
            "pending": results["bookings_pending"],
            "confirmed": results["bookings_confirmed"],
            "completed": results["bookings_completed"],
            "cancelled": results["bookings_cancelled"],
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    # Cache the result
    with _stats_lock:
        _stats_cache["data"] = data
        _stats_cache["expires_at"] = time.monotonic() + _STATS_TTL

    return data


# ─── Admin station listing ──────────────────────────────────
# Fields the admin list view needs. Keeps payloads small.
_ADMIN_STATION_FIELDS = {
    "name", "city", "address", "status", "station_type",
    "owner_id", "created_at", "image_url", "phone", "email",
}


def _fetch_owners_batch(owner_ids: list) -> dict:
    """
    Fetch multiple user docs in ONE Firestore round-trip.
    Returns { owner_id: { full_name, email } }.
    """
    if not owner_ids:
        return {}

    refs = [db.collection("users").document(uid) for uid in owner_ids]
    owners = {}
    for doc in db.get_all(refs):
        if doc.exists:
            data = doc.to_dict() or {}
            owners[doc.id] = {
                "full_name": data.get("full_name", "Unknown"),
                "email": data.get("email", ""),
            }
    return owners


def get_admin_stations(
    status: str = None,
    station_type: str = None,
    limit: int = 20,
    cursor: str = None,
) -> dict:
    """
    Return a paginated list of stations for the admin panel.
    """
    limit = max(1, min(int(limit or 20), 50))

    # Build the base query with optional filters
    query = db.collection("stations")
    if status:
        query = query.where("status", "==", status)
    if station_type:
        query = query.where("station_type", "==", station_type)

    query = query.order_by("created_at", direction="DESCENDING")

    # Total count (with same filters)
    try:
        total = int(query.count().get()[0][0].value)
    except Exception as e:
        print(f"[admin_stations] Count query failed: {e}")
        total = 0

    # Apply cursor for pagination
    if cursor:
        last_doc = db.collection("stations").document(cursor).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    # Fetch the page
    docs = query.limit(limit).stream()

    stations = []
    owner_ids = set()
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        trimmed = {k: v for k, v in data.items() if k in _ADMIN_STATION_FIELDS or k == "id"}
        stations.append(trimmed)
        if trimmed.get("owner_id"):
            owner_ids.add(trimmed["owner_id"])

    # Batch-fetch owners and merge into station records
    owners = _fetch_owners_batch(list(owner_ids))
    for station in stations:
        owner = owners.get(station.get("owner_id") or "", {})
        station["owner_name"] = owner.get("full_name", "Unknown")
        station["owner_email"] = owner.get("email", "")

    next_cursor = stations[-1]["id"] if stations else None

    return {
        "stations": stations,
        "total": total,
        "next_cursor": next_cursor,
    }


# ─── Admin station moderation ───────────────────────────────
# Valid status values for stations.
_VALID_STATION_STATUSES = {
    "DRAFT", "SUBMITTED", "APPROVED", "REJECTED",
    "SUSPENDED", "CHANGES_REQUESTED", "CHANGES_PENDING",
}

# Statuses that should be publicly visible in the mobile app.
_PUBLIC_STATUSES = {"APPROVED"}

# Valid state transitions for moderation actions.
_ALLOWED_TRANSITIONS = {
    # From SUBMITTED: admin can approve, reject, or request changes
    "SUBMITTED": {"APPROVED", "REJECTED", "CHANGES_REQUESTED"},

    # From CHANGES_PENDING: admin can approve or reject the resubmission
    "CHANGES_PENDING": {"APPROVED", "REJECTED"},

    # From APPROVED: admin can suspend
    "APPROVED": {"SUSPENDED"},

    # From SUSPENDED: admin can restore
    "SUSPENDED": {"APPROVED"},

    # From CHANGES_REQUESTED: partner edits then resubmits (handled elsewhere)
    # From DRAFT: partner submits (handled elsewhere)
    # From REJECTED: terminal
}


def _status_label(status: str) -> str:
    """Friendly label for status messages."""
    return {
        "APPROVED": "approved",
        "REJECTED": "rejected",
        "SUSPENDED": "suspended",
        "CHANGES_REQUESTED": "marked for changes",
        "SUBMITTED": "submitted",
        "DRAFT": "drafted",
    }.get(status, status.lower())


def update_station_status(
    station_id: str,
    new_status: str,
    reason: str,
    admin_id: str,
) -> dict:
    """
    Update a station's approval status.

    Validation:
      - new_status must be a valid status
      - transition from current status to new_status must be allowed
      - reason is required for REJECTED, SUSPENDED, CHANGES_REQUESTED

    Side effects:
      - Updates station document:
          status, is_public, reviewed_by, reviewed_at, review_notes
      - Appends to moderation_history array
      - Clears the platform-stats cache (so /admin/stats reflects the change)

    Returns:
      { "message", "station_id", "previous_status", "new_status" }
    """
    from fastapi import HTTPException, status as http_status

    # ─── Validate input ─────────────────────────────────────
    if new_status not in _VALID_STATION_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {sorted(_VALID_STATION_STATUSES)}",
        )

    # Reason required for negative actions
    if new_status in {"REJECTED", "SUSPENDED", "CHANGES_REQUESTED"}:
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"A reason is required when setting status to {new_status}",
            )

    # ─── Fetch station ──────────────────────────────────────
    doc_ref = db.collection("stations").document(station_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Station not found",
        )

    station = doc.to_dict() or {}
    previous_status = station.get("status", "DRAFT")

    # ─── Validate transition ────────────────────────────────
    allowed = _ALLOWED_TRANSITIONS.get(previous_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot transition from {previous_status} to {new_status}. "
                f"Allowed: {sorted(allowed) if allowed else 'none'}"
            ),
        )

    # ─── Apply update ───────────────────────────────────────
    now_iso = datetime.utcnow().isoformat() + "Z"
    is_public = new_status in _PUBLIC_STATUSES

    # Append to moderation history
    history_entry = {
        "action": new_status,
        "reason": reason.strip() if reason else "",
        "by": admin_id,
        "at": now_iso,
        "previous_status": previous_status,
    }
    history = list(station.get("moderation_history", []) or [])
    history.append(history_entry)

    doc_ref.update({
        "status": new_status,
        "is_public": is_public,
        "reviewed_by": admin_id,
        "reviewed_at": now_iso,
        "review_notes": reason.strip() if reason else "",
        "moderation_history": history,
    })

    # Clear platform stats cache so next /admin/stats reflects the change
    with _stats_lock:
        _stats_cache["data"] = None
        _stats_cache["expires_at"] = 0.0

    return {
        "message": f"Station {_status_label(new_status)}",
        "station_id": station_id,
        "previous_status": previous_status,
        "new_status": new_status,
    }

    # Build the base query with optional filters
    query = db.collection("stations")
    if status:
        query = query.where("status", "==", status)
    if station_type:
        query = query.where("station_type", "==", station_type)

    query = query.order_by("created_at", direction="DESCENDING")

    # Total count (with same filters)
    try:
        total = int(query.count().get()[0][0].value)
    except Exception as e:
        print(f"[admin_stations] Count query failed: {e}")
        total = 0

    # Apply cursor for pagination
    if cursor:
        last_doc = db.collection("stations").document(cursor).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    # Fetch the page
    docs = query.limit(limit).stream()

    stations = []
    owner_ids = set()
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        # Keep only fields we need
        trimmed = {k: v for k, v in data.items() if k in _ADMIN_STATION_FIELDS or k == "id"}
        stations.append(trimmed)
        if trimmed.get("owner_id"):
            owner_ids.add(trimmed["owner_id"])

    # Batch-fetch owners and merge into station records
    owners = _fetch_owners_batch(list(owner_ids))
    for station in stations:
        owner = owners.get(station.get("owner_id") or "", {})
        station["owner_name"] = owner.get("full_name", "Unknown")
        station["owner_email"] = owner.get("email", "")

    next_cursor = stations[-1]["id"] if stations else None

    return {
        "stations": stations,
        "total": total,
        "next_cursor": next_cursor,
    }


# ─── Admin user management ──────────────────────────────────
# Fields safe to expose to the admin panel (NEVER include password)
_ADMIN_USER_FIELDS = {
    "full_name", "email", "phone", "role", "status",
    "profile_image", "created_at", "suspended_at",
    "suspended_by", "suspension_reason",
}

# Valid user roles.
_VALID_USER_ROLES = {"user", "station_owner", "admin"}

# Valid user statuses.
_VALID_USER_STATUSES = {"ACTIVE", "SUSPENDED", "BLOCKED", "PENDING"}


def get_admin_users(
    role: str = None,
    status: str = None,
    limit: int = 20,
    cursor: str = None,
) -> dict:
    """
    Return a paginated list of users for the admin panel.

    Query params:
      - role:    Filter by role ("user", "station_owner", "admin")
      - status:  Filter by status ("ACTIVE", "SUSPENDED", "BLOCKED", "PENDING")
      - limit:   Page size (1-100, default 20)
      - cursor:  Last user ID from previous page

    To avoid needing many composite indexes, we fetch all users
    in a single query (sorted by created_at) and filter in memory.
    This is fast enough for admin dashboards with up to a few thousand users.
    """
    limit = max(1, min(int(limit or 20), 100))

    # Step 1: Fetch ALL users sorted by created_at DESC
    # This uses only a single-field index (auto-created), no composite needed.
    docs = (
        db.collection("users")
        .order_by("created_at", direction="DESCENDING")
        .limit(500)
        .stream()
    )

    all_users = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        data.pop("password", None)  # ⚠️ Never expose password

        trimmed = {k: v for k, v in data.items() if k in _ADMIN_USER_FIELDS or k == "id"}

        # Default missing fields
        if not trimmed.get("status"):
            trimmed["status"] = "ACTIVE"
        if not trimmed.get("role"):
            trimmed["role"] = "user"

        all_users.append(trimmed)

    # Step 2: Filter in memory
    if role:
        all_users = [u for u in all_users if u.get("role") == role]
    if status:
        all_users = [u for u in all_users if u.get("status") == status]

    # Step 3: Apply cursor for pagination
    if cursor:
        ids = [u["id"] for u in all_users]
        if cursor in ids:
            idx = ids.index(cursor)
            all_users = all_users[idx + 1:]

    # Step 4: Slice the page
    total = len(all_users)
    page = all_users[:limit]
    next_cursor = page[-1]["id"] if len(page) == limit else None

    return {
        "users": page,
        "total": total,
        "next_cursor": next_cursor,
    }


def update_user_status(
    user_id: str,
    new_status: str,
    reason: str,
    admin_id: str,
) -> dict:
    """
    Update a user's status (suspend / reactivate / block / unblock).

    Validation:
      - new_status must be a valid status
      - reason is required for SUSPENDED and BLOCKED
      - Cannot suspend/block yourself (admin)
      - Cannot suspend/block another admin

    Side effects:
      - Updates user document: status, suspended_at, suspended_by, suspension_reason
      - Appends to user's moderation_history (if exists)
    """
    from fastapi import HTTPException, status as http_status

    # Validate status
    if new_status not in _VALID_USER_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {sorted(_VALID_USER_STATUSES)}",
        )

    # Reason required for negative actions
    if new_status in {"SUSPENDED", "BLOCKED"}:
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"A reason is required when setting status to {new_status}",
            )

    # Prevent self-suspension
    if user_id == admin_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own status",
        )

    # Fetch user
    doc_ref = db.collection("users").document(user_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user = doc.to_dict() or {}
    previous_status = user.get("status", "ACTIVE")

    # Prevent suspending other admins
    if user.get("role") == "admin" and new_status in {"SUSPENDED", "BLOCKED"}:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend or block another admin",
        )

    # Apply update
    now_iso = datetime.utcnow().isoformat() + "Z"

    update_data = {
        "status": new_status,
    }

    # Set/clear suspension fields based on new status
    if new_status in {"SUSPENDED", "BLOCKED"}:
        update_data["suspended_at"] = now_iso
        update_data["suspended_by"] = admin_id
        update_data["suspension_reason"] = reason.strip()
    else:
        # Reactivating: clear suspension fields
        update_data["suspended_at"] = None
        update_data["suspended_by"] = None
        update_data["suspension_reason"] = ""

    # Append to moderation history
    history = list(user.get("moderation_history", []) or [])
    history.append({
        "action": new_status,
        "reason": reason.strip() if reason else "",
        "by": admin_id,
        "at": now_iso,
        "previous_status": previous_status,
    })
    update_data["moderation_history"] = history

    doc_ref.update(update_data)

    # Clear stats cache (user counts changed)
    with _stats_lock:
        _stats_cache["data"] = None
        _stats_cache["expires_at"] = 0.0

    return {
        "message": f"User {new_status.lower()}",
        "user_id": user_id,
        "previous_status": previous_status,
        "new_status": new_status,
    }