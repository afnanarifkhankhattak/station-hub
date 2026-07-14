from fastapi import HTTPException
from config.firebase import db
from datetime import datetime


def add_favorite(service_id: str, tier: str, user_id: str) -> dict:
    service_doc = db.collection("services").document(service_id).get()
    if not service_doc.exists:
        raise HTTPException(status_code=404, detail="Service not found")

    fav_id = f"{user_id}_{service_id}_{tier}"
    db.collection("favorites").document(fav_id).set({
        "user_id": user_id,
        "service_id": service_id,
        "tier": tier,
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"message": "Added to favorites"}


def remove_favorite(service_id: str, tier: str, user_id: str) -> dict:
    fav_id = f"{user_id}_{service_id}_{tier}"
    db.collection("favorites").document(fav_id).delete()
    return {"message": "Removed from favorites"}


def get_favorites(user_id: str) -> dict:
    docs = db.collection("favorites").where("user_id", "==", user_id).stream()
    fav_entries = [d.to_dict() for d in docs]

    if not fav_entries:
        return {"services": []}

    # Bulk-fetch all service docs in ONE network call (instead of N)
    service_ids = list({e["service_id"] for e in fav_entries if e.get("service_id")})
    svc_map = {}
    if service_ids:
        svc_refs = [db.collection("services").document(sid) for sid in service_ids]
        for doc in db.get_all(svc_refs):
            if doc.exists:
                svc_map[doc.id] = doc.to_dict()

    results = []
    for entry in fav_entries:
        service_data = svc_map.get(entry["service_id"])
        if service_data:
            results.append({
                "id": entry["service_id"],
                "tier": entry["tier"],
                **service_data,
            })

    return {"services": results}