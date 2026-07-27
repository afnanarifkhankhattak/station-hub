from fastapi import HTTPException
from config.firebase import db
from schemas.service_schemas import ServiceRequest
from datetime import datetime

# Default catalog seeded once for each new station-owner account.
_CAR_PRICE = 1000.0
_BIKE_PRICE = 500.0

_DEFAULT_CATEGORIES = {
    "sedan": {"price": _CAR_PRICE},
    "hatchback": {"price": _CAR_PRICE},
    "suv": {"price": _CAR_PRICE},
    "full_suv": {"price": _CAR_PRICE},
    "pickup": {"price": _CAR_PRICE},
    "economy_bike": {"price": _BIKE_PRICE},
    "standard_bike": {"price": _BIKE_PRICE},
    "premium_bike": {"price": _BIKE_PRICE},
}

DEFAULT_SERVICE_CATALOG = [
    {
        "name": "Wash",
        "description": "Exterior wash for cars and bikes. Quick clean to refresh your vehicle.",
        "image_url": "https://res.cloudinary.com/dqlmva24c/image/upload/v1784799014/stationhub/default_services/stationhub/default_services/wash.jpg",
    },
    {
        "name": "Service",
        "description": "General vehicle service and basic maintenance checks.",
        "image_url": "https://res.cloudinary.com/dqlmva24c/image/upload/v1784799017/stationhub/default_services/stationhub/default_services/service.jpg",
    },
    {
        "name": "Polishing",
        "description": "Surface polishing to restore shine and reduce light scratches.",
        "image_url": "https://res.cloudinary.com/dqlmva24c/image/upload/v1784799023/stationhub/default_services/stationhub/default_services/polishing.jpg",
    },
    {
        "name": "Detailing",
        "description": "Full detailing for a deep clean inside and out.",
        "image_url": "https://res.cloudinary.com/dqlmva24c/image/upload/v1784799027/stationhub/default_services/stationhub/default_services/detailing.jpg",
    },
]


def seed_default_services_for_owner(user_id: str) -> int:
    """
    Create the standard starter services for a newly registered owner.
    Idempotent: skips if the owner already has any services.
    Returns the number of services created.
    """
    existing = (
        db.collection("services")
        .where("owner_id", "==", user_id)
        .limit(1)
        .get()
    )
    if existing:
        return 0

    now = datetime.utcnow().isoformat()
    batch = db.batch()
    created = 0

    for item in DEFAULT_SERVICE_CATALOG:
        ref = db.collection("services").document()
        batch.set(
            ref,
            {
                "name": item["name"],
                "description": item["description"],
                "categories": {
                    key: dict(value) for key, value in _DEFAULT_CATEGORIES.items()
                },
                "status": "Active",
                "rating": None,
                "image_url": item.get("image_url") or "",
                "station_ids": [],
                "owner_id": user_id,
                "created_at": now,
            },
        )
        created += 1

    batch.commit()
    return created


def get_all_services(user_id: str) -> dict:
    docs = (
        db.collection("services")
        .where("owner_id", "==", user_id)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    services = [{"id": d.id, **d.to_dict()} for d in docs]
    return {"services": services}


def add_service(body: ServiceRequest, user_id: str) -> dict:
    data = body.dict()
    data["owner_id"] = user_id
    data["created_at"] = datetime.utcnow().isoformat()
    ref = db.collection("services").add(data)
    return {"message": "Service added", "service": {"id": ref[1].id, **data}}


def update_service(service_id: str, body: ServiceRequest, user_id: str) -> dict:
    doc_ref = db.collection("services").document(service_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Service not found")
    if doc.to_dict().get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    data = body.dict()
    data["updated_at"] = datetime.utcnow().isoformat()
    # Replace the document so outdated pricing fields are removed on the next edit.
    data["owner_id"] = user_id
    data["created_at"] = doc.to_dict().get("created_at", data["updated_at"])
    doc_ref.set(data)
    return {"message": "Service updated", "service": {"id": service_id, **data}}


def delete_service(service_id: str, user_id: str) -> dict:
    doc_ref = db.collection("services").document(service_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Service not found")
    if doc.to_dict().get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    doc_ref.delete()
    return {"message": "Service deleted"}

def get_public_services(limit: int = 50) -> dict:
    limit = max(1, min(int(limit or 50), 100))
    docs = (
        db.collection("services")
        .where("status", "==", "Active")
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    services = [{"id": d.id, **(d.to_dict() or {})} for d in docs]
    return {"services": services}


def get_public_service_by_id(service_id: str) -> dict:
    doc = db.collection("services").document(service_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"service": {"id": doc.id, **doc.to_dict()}}


def get_services_for_station(station_id: str) -> dict:
    status_docs = (
        db.collection("serviceStationStatus")
        .where("stationId", "==", station_id)
        .where("isAvailable", "==", True)
        .stream()
    )
    service_ids = list({d.to_dict().get("serviceId") for d in status_docs if d.to_dict().get("serviceId")})

    if not service_ids:
        return {"services": []}

    # Fetch all at once using native bulk get (No ThreadPool needed)
    service_refs = [db.collection("services").document(sid) for sid in service_ids]
    
    services = []
    for doc in db.get_all(service_refs):
        if doc.exists:
            services.append({"id": doc.id, **doc.to_dict()})

    services.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"services": services}
