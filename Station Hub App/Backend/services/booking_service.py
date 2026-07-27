# pyrefly: ignore [missing-import]
from fastapi import HTTPException
from config.firebase import db
from models.booking_model import BookingModel
from schemas.booking_schemas import BookingRequest
from utils.email_handler import send_booking_email
from firebase_admin import firestore
from services.booking_events import booking_events
import threading


def _resolve_price(service: dict, booking: dict) -> float | None:
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

    return None


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
        car_category=body.car_category or "",
        vehicle_brand=body.vehicle_brand or "",
        vehicle_number=body.vehicle_number or "",
        special_request=body.special_request or "",
        service_id=body.service_id or "",
        tier=body.tier or "",
    )

    doc_ref = db.collection("bookings").add(booking.to_dict())
    booking_id = doc_ref[1].id
    booking_events.publish(user_id, booking_id, "pending")

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
    """Count unread non-pending bookings via aggregation (no doc stream)."""
    base = (
        db.collection("bookings")
        .where("user_id", "==", user_id)
        .where("customer_read", "==", False)
    )
    total = int(base.count().get()[0][0].value)
    if total == 0:
        return {"unread_count": 0}
    pending = int(
        base.where("status", "==", "pending").count().get()[0][0].value
    )
    return {"unread_count": max(0, total - pending)}


def get_my_bookings(user_id: str, limit: int = 50) -> dict:
    docs = (
        db.collection("bookings")
        .where("user_id", "==", user_id)
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    bookings = [{"id": d.id, **d.to_dict()} for d in docs]

    if not bookings:
        return {"bookings": []}

    station_ids = list({b["station_id"] for b in bookings if b.get("station_id")})
    service_ids = list({b["service_id"] for b in bookings if b.get("service_id")})

    refs = [db.collection("stations").document(sid) for sid in station_ids]
    refs += [db.collection("services").document(sid) for sid in service_ids]
    stations, services = {}, {}
    if refs:
        for doc in db.get_all(refs):
            if not doc.exists:
                continue
            col = doc.reference.parent.id
            if col == "stations":
                stations[doc.id] = doc.to_dict()
            else:
                services[doc.id] = doc.to_dict()

    for b in bookings:
        station = stations.get(b.get("station_id"), {})
        service = services.get(b.get("service_id"), {})
        b["station_name"] = station.get("name", "")
        b["service_name"] = service.get("name", "")
        b["service_image"] = service.get("image_url", "")
        b["price"] = _resolve_price(service, b)

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

    booking = doc.to_dict()
    if booking.get("status") != "cancelled":
        doc_ref.update({"status": "cancelled"})
        booking_events.publish(user_id, booking_id, "cancelled")

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
    excluded = {"cancelled", "rejected"}
    docs = (
        db.collection("bookings")
        .where("station_id", "==", station_id)
        .where("travel_date", "==", date)
        .select(["travel_time", "status"])
        .stream()
    )
    slots = []
    for doc in docs:
        data = doc.to_dict() or {}
        if data.get("status") in excluded:
            continue
        t = data.get("travel_time")
        if t:
            slots.append(t)
    return slots
