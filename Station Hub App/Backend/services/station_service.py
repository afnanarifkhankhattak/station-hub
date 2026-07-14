
from fastapi import HTTPException
from config.firebase import db
from datetime import datetime


async def get_all_stations() -> dict:
    docs = db.collection("stations").stream()
    stations = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        stations.append(data)
    return {"stations": stations}


async def get_public_stations(limit: int = 20, offset: int = 0) -> dict:
    """
    OPTIMIZED: Uses Firestore-native limit + offset so only the requested page
    is downloaded — NOT the entire collection.

    NOTE: We do NOT use order_by here because combining where() + order_by()
    on different fields requires a composite Firestore index. Instead, we omit
    order_by and let the frontend handle sort (it already has sort buttons).
    The count() is done on a separate simple-filter query which uses the
    auto-created single-field index — no manual composite index needed.
    """
    base_filter = (
        db.collection("stations")
        .where("status", "==", "Active")
    )

    # Lightweight count — simple where() uses auto single-field index
    count_result = base_filter.count().get()
    total = count_result[0][0].value if count_result else 0

    # Fetch only the requested page — no order_by so no composite index needed
    docs = base_filter.limit(limit).offset(offset).stream()

    stations = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        stations.append(data)

    return {"stations": stations, "total": total}


async def public_search_stations(q: str) -> dict:
    """
    OPTIMIZED: Caps the collection scan at 200 docs and returns
    at most 30 matches. Firestore doesn't support arbitrary substring
    search natively so Python-side filtering is still needed, but the
    scan is now bounded.
    """
    docs = (
        db.collection("stations")
        .where("status", "==", "Active")
        .limit(200)   # bound the worst-case scan
        .stream()
    )
    results = []
    q_lower = q.lower()
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        name = data.get("name", "").lower()
        if q_lower in name:
            results.append(data)
            if len(results) >= 30:   # return at most 30 matches
                break
    return {"stations": results}


async def search_stations(q: str) -> dict:
    """OPTIMIZED: Same bounded scan as public_search_stations."""
    docs = (
        db.collection("stations")
        .limit(200)
        .stream()
    )
    results = []
    q_lower = q.lower()
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        name = data.get("name", "").lower()
        if q_lower in name:
            results.append(data)
            if len(results) >= 30:
                break
    return {"stations": results}


async def get_station_by_id(station_id: str) -> dict:
    doc = db.collection("stations").document(station_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return {"station": data}


async def add_station(body) -> dict:
    data = body.model_dump()
    data["created_at"] = datetime.utcnow().isoformat()
    doc_ref = db.collection("stations").add(data)
    return {"message": "Station added", "id": doc_ref[1].id}


async def rate_station(station_id: str, user_id: str, rating: int) -> dict:
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    doc_ref = db.collection("stations").document(station_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")

    data = doc.to_dict()
    ratings = data.get("ratings", {})
    
    # save user's rating
    ratings[user_id] = rating

    # recalculate average
    avg = round(sum(ratings.values()) / len(ratings), 1)
    count = len(ratings)

    doc_ref.update({
        f"ratings.{user_id}": rating,
        "avg_rating": avg,
        "rating_count": count,
    })

    return {"avg_rating": avg, "rating_count": count, "user_rating": rating}