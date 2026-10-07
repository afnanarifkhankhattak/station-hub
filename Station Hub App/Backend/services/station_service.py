from fastapi import HTTPException
from config.firebase import db
from datetime import datetime
import threading
import time
import math

# Fields safe to return to public mobile clients.
STATION_PUBLIC_FIELDS = {
    "id", "name", "address", "city", "image_url",
    "avg_rating", "rating_count", "booking_count",
    "latitude", "longitude", "opening", "closing",
    "sun_off", "status", "created_at",
    "station_type", "phone", "website", "connectors",  # HEV support
}

# Fields the map screen needs (kept small: the map loads every station at once)
MAP_FIELDS = ("id", "name", "address", "city", "latitude", "longitude", "station_type")

# ponytail: 60s active-station list cache; bump if station catalog changes faster
_ACTIVE_TTL = 60.0
_active_lock = threading.Lock()
_active_cache = {"stations": None, "expires_at": 0.0}
_count_cache = {"value": None, "expires_at": 0.0}


# ─── Distance helper ────────────────────────────────────────
def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two lat/lon points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _public_station(doc) -> dict:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return {k: v for k, v in data.items() if k in STATION_PUBLIC_FIELDS}


def _load_active_public_stations() -> list:
    """Load APPROVED stations only — the modern status value."""
    docs = (
        db.collection("stations")
        .where("status", "==", "APPROVED")
        .select([f for f in STATION_PUBLIC_FIELDS if f != "id"])
        .stream()
    )
    out = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        out.append(data)
    return out


def _active_stations_cached() -> list:
    now = time.monotonic()
    with _active_lock:
        if _active_cache["stations"] is not None and now < _active_cache["expires_at"]:
            return _active_cache["stations"]
    stations = _load_active_public_stations()
    with _active_lock:
        _active_cache["stations"] = stations
        _active_cache["expires_at"] = time.monotonic() + _ACTIVE_TTL
    return stations


def get_all_stations(user_id: str | None = None) -> dict:
    """Owner-scoped when user_id given — never dump the whole collection."""
    if user_id:
        docs = db.collection("stations").where("owner_id", "==", user_id).stream()
    else:
        docs = db.collection("stations").limit(100).stream()
    stations = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        stations.append(data)
    return {"stations": stations}


def get_public_stations(
    limit: int = 20,
    cursor: str | None = None,
    station_type: str | None = None,
) -> dict:
    """
    Public paginated list. Only returns APPROVED stations.
    """
    limit = max(1, min(int(limit or 20), 50))

    base_query = db.collection("stations").where("status", "==", "APPROVED")
    if station_type:
        base_query = base_query.where("station_type", "==", station_type)
    base_query = base_query.order_by("created_at", direction="DESCENDING")

    # The count cache is global, so it is only valid for the unfiltered list.
    total = None
    if not station_type:
        now = time.monotonic()
        with _active_lock:
            if _count_cache["value"] is not None and now < _count_cache["expires_at"]:
                total = _count_cache["value"]
    if total is None:
        total = int(base_query.count().get()[0][0].value)
        if not station_type:
            with _active_lock:
                _count_cache["value"] = total
                _count_cache["expires_at"] = time.monotonic() + _ACTIVE_TTL

    query = base_query
    if cursor:
        last_doc = db.collection("stations").document(cursor).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    docs = query.limit(limit).stream()
    paginated = [_public_station(doc) for doc in docs]
    next_cursor = paginated[-1]["id"] if paginated else None

    return {"stations": paginated, "total": total, "next_cursor": next_cursor}


def get_map_stations(station_type: str | None = None) -> dict:
    """All approved stations with coordinates, for map pins (no pagination)."""
    stations = _active_stations_cached()
    if station_type:
        # stations created before station_type existed count as "EV"
        stations = [s for s in stations if (s.get("station_type") or "EV") == station_type]
    stations = [
        s for s in stations
        if s.get("latitude") is not None and s.get("longitude") is not None
    ]
    return {"stations": [{k: s.get(k) for k in MAP_FIELDS} for s in stations]}


# ─── Enhanced public search ─────────────────────────────────
def public_search_stations(
    q: str,
    user_lat: float | None = None,
    user_lon: float | None = None,
    require_open: bool = False,
) -> dict:
    """
    Enhanced public search:
      - Matches station name, city, address, and station_type
      - Only returns APPROVED stations
      - Optionally sorts by distance if user location provided
      - Optional filter for "currently open" stations
    """
    ql = (q or "").strip().lower()

    # Load approved stations only
    docs = (
        db.collection("stations")
        .where("status", "==", "APPROVED")
        .stream()
    )
    all_stations = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        # Trim to public fields
        trimmed = {k: v for k, v in data.items() if k in STATION_PUBLIC_FIELDS or k == "id"}
        all_stations.append(trimmed)

    # Filter by query if provided
    if ql:
        matches = []
        for s in all_stations:
            haystack = " ".join([
                (s.get("name") or "").lower(),
                (s.get("city") or "").lower(),
                (s.get("address") or "").lower(),
                (s.get("station_type") or "").lower(),
            ])
            if ql in haystack:
                matches.append(s)
    else:
        matches = all_stations

    # Filter by open (dummy — assumes `open` flag; real logic would check opening hours)
    if require_open:
        matches = [s for s in matches if s.get("open", True)]

    # Sort by distance if location provided
    if user_lat is not None and user_lon is not None:
        for s in matches:
            lat = s.get("latitude")
            lon = s.get("longitude")
            if lat is not None and lon is not None:
                s["_distance_km"] = round(
                    _haversine_km(user_lat, user_lon, float(lat), float(lon)), 2
                )
            else:
                s["_distance_km"] = None
        matches.sort(key=lambda s: (s["_distance_km"] is None, s["_distance_km"]))

    return {"stations": matches[:30]}


def search_stations(q: str, user_id: str | None = None) -> dict:
    ql = (q or "").strip().lower()
    if not ql:
        return {"stations": []}
    if user_id:
        docs = db.collection("stations").where("owner_id", "==", user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            if ql in (data.get("name") or "").lower():
                results.append(data)
        return {"stations": results[:30]}
    return public_search_stations(q)


def get_public_station_by_id(station_id: str) -> dict:
    doc = db.collection("stations").document(station_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")
    return {"station": _public_station(doc)}


def get_station_by_id(station_id: str) -> dict:
    doc = db.collection("stations").document(station_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return {"station": data}


def _coerce_lat_lon(data: dict) -> dict:
    """Ensure latitude/longitude are valid floats within bounds."""
    try:
        lat = float(data["latitude"])
        lon = float(data["longitude"])
    except (TypeError, ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid coordinates: {e}")

    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail=f"Latitude out of range: {lat}")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail=f"Longitude out of range: {lon}")

    data["latitude"] = lat
    data["longitude"] = lon
    return data


def add_station(body, user_id: str) -> dict:
    data = body.model_dump()
    data = _coerce_lat_lon(data)
    data["owner_id"] = user_id
    data["created_at"] = datetime.utcnow().isoformat()
    doc_ref = db.collection("stations").add(data)
    with _active_lock:
        _active_cache["stations"] = None
        _active_cache["expires_at"] = 0.0
        _count_cache["value"] = None
        _count_cache["expires_at"] = 0.0
    return {"message": "Station added", "id": doc_ref[1].id}


def rate_station(station_id: str, user_id: str, rating: int) -> dict:
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    doc_ref = db.collection("stations").document(station_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")

    data = doc.to_dict() or {}
    ratings = data.get("ratings", {})
    ratings[user_id] = rating
    avg = round(sum(ratings.values()) / len(ratings), 1)
    count = len(ratings)

    doc_ref.update({
        f"ratings.{user_id}": rating,
        "avg_rating": avg,
        "rating_count": count,
    })

    return {"avg_rating": avg, "rating_count": count, "user_rating": rating}