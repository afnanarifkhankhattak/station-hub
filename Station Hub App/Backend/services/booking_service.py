# pyrefly: ignore [missing-import]
from fastapi import HTTPException
from config.firebase import db
from models.booking_model import BookingModel
from schemas.booking_schemas import BookingRequest
from utils.email_handler import send_booking_email
from firebase_admin import firestore
import threading



def create_booking(body: BookingRequest, user_id: str) -> dict:
    station_doc = db.collection("stations").document(body.station_id).get()
    if not station_doc.exists:
        raise HTTPException(status_code=404, detail="Station not found")

    booking = BookingModel(
        user_id=user_id,
        station_id=body.station_id,
        travel_date=body.travel_date,
        travel_time=body.travel_time,
        vehicle_type=body.vehicle_type,
        vehicle_brand=body.vehicle_brand,
        vehicle_number=body.vehicle_number,
        special_request=body.special_request or "",
        service_id=body.service_id or "",
        tier=body.tier or "",
    )

    doc_ref = db.collection("bookings").add(booking.to_dict())
    booking_id = doc_ref[1].id

    # increment station's booking_count atomically
    db.collection("stations").document(body.station_id).update({
        "booking_count": firestore.Increment(1)
    })

    # Send email notification to owner
    try:
        station_data = station_doc.to_dict()
        owner_id = station_data.get("owner_id")
        station_name = station_data.get("name", "your station")
        if owner_id:
            owner_doc = db.collection("users").document(owner_id).get()
            if owner_doc.exists:
                owner_email = owner_doc.to_dict().get("email")
                if owner_email:
                    threading.Thread(
                        target=send_booking_email, 
                        args=(owner_email, booking.to_dict(), station_name)
                    ).start()
    except Exception as e:
        print(f"Notification error: {e}")

    return {
        "message": "Booking confirmed",
        "booking": {"id": booking_id, **booking.to_dict()},
    }

def get_unread_count(user_id: str) -> dict:
    docs = (db.collection("bookings")
        .where("user_id", "==", user_id)
        .where("customer_read", "==", False)
        .stream())
    count = sum(1 for d in docs if d.to_dict().get("status") != "pending")
    return {"unread_count": count}

def get_my_bookings(user_id: str) -> dict:
    docs = db.collection("bookings").where("user_id", "==", user_id).stream()
    bookings = [{"id": d.id, **d.to_dict()} for d in docs]

    if not bookings:
        return {"bookings": []}

    # Collect unique IDs
    station_ids = list({b["station_id"] for b in bookings if b.get("station_id")})
    service_ids = list({b["service_id"] for b in bookings if b.get("service_id")})

    stations = {}
    services = {}

    # Bulk fetch all stations in ONE network request
    if station_ids:
        station_refs = [db.collection("stations").document(sid) for sid in station_ids]
        for doc in db.get_all(station_refs):
            if doc.exists:
                stations[doc.id] = doc.to_dict()

    # Bulk fetch all services in ONE network request
    if service_ids:
        service_refs = [db.collection("services").document(sid) for sid in service_ids]
        for doc in db.get_all(service_refs):
            if doc.exists:
                services[doc.id] = doc.to_dict()

    # Enrich bookings (in-memory, instant)
    for b in bookings:
        station = stations.get(b.get("station_id"), {})
        service = services.get(b.get("service_id"), {})
        tier = b.get("tier")
        tiers = service.get("tiers") or {}

        b["station_name"] = station.get("name", "")
        b["service_name"] = service.get("name", "")
        b["service_image"] = service.get("image_url", "")
        b["price"] = tiers.get(tier, {}).get("price") if tier and tiers.get(tier) else None

    bookings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"bookings": bookings}


def get_booking_by_id(booking_id: str, user_id: str) -> dict:
    doc = db.collection("bookings").document(booking_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = doc.to_dict()

    if booking["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"booking": {"id": doc.id, **booking}}


def cancel_booking(booking_id: str, user_id: str) -> dict:
    doc_ref = db.collection("bookings").document(booking_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    if doc.to_dict()["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc_ref.update({"status": "cancelled"})

    return {"message": "Booking cancelled"}

def mark_booking_read(booking_id: str, user_id: str) -> dict:
    doc_ref = db.collection("bookings").document(booking_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    if doc.to_dict()["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc_ref.update({"customer_read": True})

    return {"message": "Marked as read"}


def get_booked_slots(station_id: str, date: str) -> list[str]:
    excluded_statuses = {"cancelled", "rejected"}
    docs = db.collection("bookings").where("station_id", "==", station_id).stream()
    
    slots = []
    for doc in docs:
        data = doc.to_dict()
        if data.get("travel_date") != date:
            continue
        if data.get("status") in excluded_statuses:
            continue
        time = data.get("travel_time")
        if time:
            slots.append(time)
    
    return slots