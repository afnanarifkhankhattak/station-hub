from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
import services.dashboard_service as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    return dashboard_service.get_dashboard_stats(current_user["sub"])


@router.patch("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    return dashboard_service.update_booking_status(booking_id, body.get("status"))