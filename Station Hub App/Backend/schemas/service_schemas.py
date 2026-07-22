from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator


class CategoryPricing(BaseModel):
    price: float

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Price must be positive")
        return value


class ServiceRequest(BaseModel):
    name: str
    categories: Dict[str, CategoryPricing]
    description: Optional[str] = ""
    status: Optional[str] = "Active"
    rating: Optional[float] = None
    image_url: Optional[str] = None
    station_ids: Optional[List[str]] = []

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, categories: Dict[str, CategoryPricing]):
        allowed = {
            # Car categories
            "sedan",
            "hatchback",
            "suv",
            "full_suv",
            "pickup",
            # Bike categories
            "economy_bike",
            "standard_bike",
            "premium_bike",
        }
        if not categories:
            raise ValueError("Select at least one vehicle category")
        invalid = set(categories) - allowed
        if invalid:
            raise ValueError(f"Invalid category(s): {', '.join(sorted(invalid))}")
        return categories
