"""
One-time backfill: add role="user" and status="ACTIVE" to users who lack them.
Run from Backend: python -m scripts.backfill_user_defaults
"""
from config.firebase import db


def backfill_user_defaults():
    users = db.collection("users").stream()
    updated = 0
    skipped = 0

    for user in users:
        data = user.to_dict() or {}
        updates = {}

        if not data.get("role"):
            updates["role"] = "user"
        if not data.get("status"):
            updates["status"] = "ACTIVE"

        if updates:
            user.reference.update(updates)
            updated += 1
            print(f"Updated {user.id}: {list(updates.keys())}")
        else:
            skipped += 1

    print(f"\nDone. Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    backfill_user_defaults()