from fastapi import HTTPException
from config.firebase import db
from datetime import datetime
import threading
import time

# Fields safe to return to public mobile clients.
STATION_PUBLIC_FIELDS = {
    "id", "name", "address", "city", "image_url",
    "avg_rating", "rating_count", "booking_count",
    "latitude", "longitude", "opening", "closing",
    "sun_off", "status", "created_at",
}

# ponytail: 60s active-station list cache; bump if station catalog changes faster
_ACTIVE_TTL = 60.0
_active_lock = threading.Lock()
_active_cache = {"stations": None, "expires_at": 0.0}
_count_cache = {"value": None, "expires_at": 0.0}


def _public_station(doc) -> dict:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return {k: v for k, v in data.items() if k in STATION_PUBLIC_FIELDS}


def _load_active_public_stations() -> list:
    docs = (
        db.collection("stations")
        .where("status", "==", "Active")
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


def get_public_stations(limit: int = 20, cursor: str | None = None) -> dict:
    limit = max(1, min(int(limit or 20), 50))
    base_query = (
        db.collection("stations")
        .where("status", "==", "Active")
        .order_by("created_at", direction="DESCENDING")
    )

    now = time.monotonic()
    with _active_lock:
        if _count_cache["value"] is not None and now < _count_cache["expires_at"]:
            total = _count_cache["value"]
        else:
            total = None
    if total is None:
        total = int(base_query.count().get()[0][0].value)
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


def public_search_stations(q: str) -> dict:
    ql = (q or "").strip().lower()
    if not ql:
        return {"stations": []}
    # In-memory filter on 60s cached active list — avoids full Firestore scan per keystroke
    matches = [
        s for s in _active_stations_cached()
        if ql in (s.get("name") or "").lower()
    ][:30]
    return {"stations": matches}


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
