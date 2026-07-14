from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from schemas.booking_schemas import BookingRequest
import services.booking_service as booking_service
from services.booking_service import get_booked_slots, get_unread_count

router = APIRouter(prefix="/bookings", tags=["Bookings"])



@router.post("/")
def create_booking(body: BookingRequest, current_user: dict = Depends(get_current_user)):
    return booking_service.create_booking(body, current_user["sub"])


@router.get("/slots")  # ← MUST be before /{booking_id}
def booked_slots(station_id: str, date: str):
    slots = get_booked_slots(station_id, date)
    return {"booked_slots": slots}


@router.get("/unread-count")
def unread_count(current_user: dict = Depends(get_current_user)):
    return booking_service.get_unread_count(current_user["sub"])

@router.get("/")
def get_my_bookings(current_user: dict = Depends(get_current_user)):
    return booking_service.get_my_bookings(current_user["sub"])


@router.get("/{booking_id}")
def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    return booking_service.get_booking_by_id(booking_id, current_user["sub"])


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    return booking_service.cancel_booking(booking_id, current_user["sub"])


@router.patch("/{booking_id}/read")
def mark_booking_read(booking_id: str, current_user: dict = Depends(get_current_user)):
    return booking_service.mark_booking_read(booking_id, current_user["sub"])