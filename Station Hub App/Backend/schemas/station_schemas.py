from pydantic import BaseModel, Field
from typing import Optional, List


class StationRequest(BaseModel):
    name: str
    city: str
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    image: Optional[str] = None
    amenities: Optional[List[str]] = []


class RatingRequest(BaseModel):
    rating: int