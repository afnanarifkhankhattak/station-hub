from pydantic import BaseModel
from typing import Optional


class BookingRequest(BaseModel):
    station_id: str
    travel_date: str
    travel_time: str
    vehicle_type: str
    vehicle_brand: Optional[str] = ""
    vehicle_number: Optional[str] = ""
    special_request: Optional[str] = ""
    service_id: Optional[str] = None
    tier: Optional[str] = None
    car_category: Optional[str] = None