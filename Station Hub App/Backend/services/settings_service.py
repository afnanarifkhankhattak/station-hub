from fastapi import HTTPException
from config.firebase import db
from pydantic import BaseModel

DEFAULT_CATEGORIES = [
    'Car Wash & Detailing',
    'Auto Repair',
    'Tyre & Wheel Service',
    'Oil & Lube',
    'Transport / Bus Station',
    'Fuel Station',
    'Electric Vehicle Charging',
    'Parking',
    'Motorcycle Service',
    'Truck & Heavy Vehicle',
]

DEFAULTS = {
    "shop_name": "",
    "address": "",
    "phone": "",
    "email": "",
    "category": "Car Wash & Detailing",
    "description": "",
    "latitude": None,
    "longitude": None,
    "mon_fri_open": "09:00",
    "mon_fri_close": "18:00",
    "sat_open": "10:00",
    "sat_close": "17:00",
    "sun_off": True,
    "break_start": "13:00",
    "break_end": "14:00",
    "slot_duration": "30 mins",
    "max_bookings": 10,
    "theme": "light",
}


def get_settings(user_id: str) -> dict:
    doc = db.collection("shop_settings").document(user_id).get()
    if not doc.exists:
        db.collection("shop_settings").document(user_id).set(DEFAULTS)
        return {"settings": DEFAULTS}
    return {"settings": doc.to_dict()}


def update_section(body: BaseModel, user_id: str) -> dict:
    ref = db.collection("shop_settings").document(user_id)
    if not ref.get().exists:
        db.collection("shop_settings").document(user_id).set(DEFAULTS)

    # Allow bool False and int 0 through — only skip actual None
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided")

    ref.update(update_data)
    return {"message": "Settings updated successfully"}


def get_categories() -> dict:
    doc = db.collection("app_config").document("categories").get()
    if not doc.exists:
        db.collection("app_config").document("categories").set(
            {"list": DEFAULT_CATEGORIES}
        )
        return {"categories": DEFAULT_CATEGORIES}
    return {"categories": doc.to_dict().get("list", DEFAULT_CATEGORIES)}


def add_category(name: str) -> dict:
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    ref = db.collection("app_config").document("categories")
    doc = ref.get()

    if not doc.exists:
        ref.set({"list": DEFAULT_CATEGORIES + [name]})
        return {"message": "Category added", "name": name}

    current = doc.to_dict().get("list", DEFAULT_CATEGORIES)
    if name.lower() in [c.lower() for c in current]:
        raise HTTPException(status_code=400, detail="Category already exists")

    current.append(name)
    ref.update({"list": current})
    return {"message": "Category added", "name": name}