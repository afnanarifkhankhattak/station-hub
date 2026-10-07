from pydantic import BaseModel, Field
from typing import List, Optional


class ReviewCreateRequest(BaseModel):
    """Payload for creating a new review."""
    booking_id: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field("", max_length=1000)
    tags: Optional[List[str]] = Field(default_factory=list)


class ReviewModerateRequest(BaseModel):
    """Admin action to hide or unhide a review."""
    hidden: bool
    reason: Optional[str] = ""