
from fastapi import HTTPException
from config.firebase import db
from datetime import datetime

# Fields safe to return to public mobile clients.
# Notably excludes the 'ratings' map (which stores every user's individual
# rating and can be massive) and internal fields like 'owner_id'.
STATION_PUBLIC_FIELDS = {
    "id", "name", "address", "city", "image_url",
    "avg_rating", "rating_count", "booking_count",
    "latitude", "longitude", "opening", "closing",
    "sun_off", "status", "created_at",
}


def _public_station(doc) -> dict:
    """Convert a Firestore doc to a public-safe station dict."""
    data = doc.to_dict()
    data["id"] = doc.id
    return {k: v for k, v in data.items() if k in STATION_PUBLIC_FIELDS}


def get_all_stations() -> dict:
    docs = db.collection("stations").stream()
    stations = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        stations.append(data)
    return {"stations": stations}

def get_public_stations(limit: int = 20, offset: int = 0) -> dict:
    docs = db.collection("stations").where("status", "==", "Active").stream()
    all_stations = [_public_station(doc) for doc in docs]
    
    # Sort in memory (descending by created_at)
    all_stations.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    total = len(all_stations)
    paginated = all_stations[offset : offset + limit]

    return {"stations": paginated, "total": total}

def public_search_stations(q: str) -> dict:
    docs = db.collection("stations").where("status", "==", "Active").stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        name = data.get("name", "").lower()
        if q.lower() in name:
            filtered = {k: v for k, v in data.items() if k in STATION_PUBLIC_FIELDS}
            filtered["id"] = doc.id
            results.append(filtered)
    return {"stations": results}


def search_stations(q: str) -> dict:
    docs = db.collection("stations").stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        name = data.get("name", "").lower()
        if q.lower() in name:
            results.append(data)
    return {"stations": results}


def get_station_by_id(station_id: str) -> dict:
    doc = db.collection("stations").document(station_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return {"station": data}


def add_station(body) -> dict:
    data = body.model_dump()
    data["created_at"] = datetime.utcnow().isoformat()
    doc_ref = db.collection("stations").add(data)
    return {"message": "Station added", "id": doc_ref[1].id}

def rate_station(station_id: str, user_id: str, rating: int) -> dict:
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