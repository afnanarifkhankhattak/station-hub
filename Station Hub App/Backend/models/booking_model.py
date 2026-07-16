from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class BookingModel:
    user_id: str
    station_id: str
    travel_date: str
    travel_time: str
    vehicle_type: str
    vehicle_brand: str
    vehicle_number: str
    special_request: Optional[str] = ""
    service_id: Optional[str] = ""
    status: str = "pending"
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    tier: Optional[str] = ""
    car_category: Optional[str] = ""

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "station_id": self.station_id,
            "travel_date": self.travel_date,
            "travel_time": self.travel_time,
            "vehicle_type": self.vehicle_type,
            "vehicle_brand": self.vehicle_brand,
            "vehicle_number": self.vehicle_number,
            "special_request": self.special_request,
            "service_id": self.service_id,
            "status": self.status,
            "created_at": self.created_at,
            "tier": self.tier,
            "car_category": self.car_category,
        }
