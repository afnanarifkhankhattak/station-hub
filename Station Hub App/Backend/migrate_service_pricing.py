"""One-time migration from legacy tier pricing to one price per car category.

Run from Backend: python migrate_service_pricing.py
"""
from config.firebase import db
from firebase_admin import firestore

CATEGORIES = ("sedan", "hatchback", "suv", "full_suv", "pickup")


def legacy_price(value: dict) -> float | None:
    if value.get("price") is not None:
        return value["price"]
    return (value.get("base") or value.get("premium") or {}).get("price")


def main():
    for document in db.collection("services").stream():
        service = document.to_dict()
        categories = {
            name: {"price": price}
            for name, value in (service.get("categories") or {}).items()
            if (price := legacy_price(value)) is not None
        }
        if not categories:
            fallback = legacy_price(service.get("tiers") or {})
            if fallback is not None:
                categories = {name: {"price": fallback} for name in CATEGORIES}
        if categories:
            document.reference.update({"categories": categories, "tiers": firestore.DELETE_FIELD})
            print(f"Migrated {document.id}")


if __name__ == "__main__":
    main()
