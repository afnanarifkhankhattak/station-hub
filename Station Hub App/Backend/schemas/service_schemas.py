# from pydantic import BaseModel
# from typing import Optional, List


# class ServiceRequest(BaseModel):
#     name: str
#     price: float
#     duration: str
#     description: Optional[str] = ""
#     status: Optional[str] = "Active"
#     rating: Optional[float] = None
#     image_url: Optional[str] = None
#     station_ids: Optional[List[str]] = [] 


from pydantic import BaseModel, validator
from typing import Optional, List, Dict


class TierDetail(BaseModel):
    price: float
    duration: str


class CategoryPricing(BaseModel):
    base: Optional[TierDetail] = None
    premium: Optional[TierDetail] = None


class ServiceRequest(BaseModel):
    name: str
    tiers: Optional[Dict[str, TierDetail]] = None
    categories: Optional[Dict[str, CategoryPricing]] = None
    description: Optional[str] = ""
    status: Optional[str] = "Active"
    rating: Optional[float] = None
    image_url: Optional[str] = None
    station_ids: Optional[List[str]] = []

    @validator("categories", always=True)
    def check_pricing(cls, categories, values):
        tiers = values.get("tiers")
        if not tiers and not categories:
            raise ValueError("Either tiers or categories pricing must be provided")
        
        # If tiers provided, validate them
        if tiers:
            allowed = {"base", "premium"}
            invalid = set(tiers.keys()) - allowed
            if invalid:
                raise ValueError(f"Invalid tier name(s): {', '.join(invalid)}")
            for t_name, t_val in tiers.items():
                if t_val.price <= 0:
                    raise ValueError(f"Price must be positive for tier {t_name}")
        
        # If categories provided, validate them
        if categories:
            allowed_cats = {"sedan", "hatchback", "suv", "microcar", "pickup"}
            invalid_cats = set(categories.keys()) - allowed_cats
            if invalid_cats:
                raise ValueError(f"Invalid category(s): {', '.join(invalid_cats)}")
            
            for cat_name, cat_val in categories.items():
                if not cat_val.base and not cat_val.premium:
                    raise ValueError(f"Category {cat_name} must have at least one tier (base or premium)")
                if cat_val.base and cat_val.base.price <= 0:
                    raise ValueError(f"Price must be positive for {cat_name} base tier")
                if cat_val.premium and cat_val.premium.price <= 0:
                    raise ValueError(f"Price must be positive for {cat_name} premium tier")
                    
        return categories