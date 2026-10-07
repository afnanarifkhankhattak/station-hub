"""
Reviews service layer.

Rules enforced here:
  - Only customers with a COMPLETED booking can review.
  - One review per booking (prevents spamming).
  - Only admins can hide/unhide reviews.
  - Station owners can NEVER edit review content.
"""
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status

from config.firebase import db


# ─── Helpers ────────────────────────────────────────────────
def _review_doc_to_dict(doc) -> dict:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def _fetch_user_summary(user_id: str) -> dict:
    """Return { full_name, profile_image } for a user."""
    if not user_id:
        return {"full_name": "Anonymous", "profile_image": ""}
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        return {"full_name": "Anonymous", "profile_image": ""}
    data = doc.to_dict() or {}
    return {
        "full_name": data.get("full_name", "Anonymous"),
        "profile_image": data.get("profile_image", ""),
    }


# ─── Create Review ──────────────────────────────────────────
def create_review(body, user_id: str) -> dict:
    """
    Create a review for a completed booking.

    Validation:
      - Booking exists
      - Booking belongs to this user
      - Booking status == "completed"
      - Booking hasn't already been reviewed
    """
    booking_doc = db.collection("bookings").document(body.booking_id).get()
    if not booking_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    booking = booking_doc.to_dict() or {}

    if booking.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This booking does not belong to you",
        )

    if booking.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review completed bookings",
        )

    # Check for existing review (one per booking)
    existing = (
        db.collection("reviews")
        .where("booking_id", "==", body.booking_id)
        .limit(1)
        .get()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this booking",
        )

    station_id = booking.get("station_id")
    if not station_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking has no associated station",
        )

    review_data = {
        "user_id": user_id,
        "station_id": station_id,
        "booking_id": body.booking_id,
        "service_id": booking.get("service_id", ""),
        "rating": int(body.rating),
        "comment": (body.comment or "").strip(),
        "tags": [t.strip() for t in (body.tags or []) if t and t.strip()][:5],
        "is_hidden": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    doc_ref = db.collection("reviews").add(review_data)
    review_id = doc_ref[1].id

    # Recalculate station average
    _recompute_station_rating(station_id)

    return {
        "message": "Review submitted",
        "review_id": review_id,
    }


# ─── Recompute Station Rating ───────────────────────────────
def _recompute_station_rating(station_id: str) -> None:
    """Recalculate avg_rating and rating_count for a station."""
    docs = (
        db.collection("reviews")
        .where("station_id", "==", station_id)
        .where("is_hidden", "==", False)
        .stream()
    )
    ratings = [int((d.to_dict() or {}).get("rating", 0)) for d in docs]
    ratings = [r for r in ratings if r > 0]

    avg = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
    count = len(ratings)

    db.collection("stations").document(station_id).update({
        "avg_rating": avg,
        "rating_count": count,
    })


# ─── List Reviews for a Station ─────────────────────────────
def get_station_reviews(station_id: str, include_hidden: bool = False) -> dict:
    """Public: list reviews for a station. Hidden ones excluded by default."""
    query = db.collection("reviews").where("station_id", "==", station_id)
    if not include_hidden:
        query = query.where("is_hidden", "==", False)

    query = query.order_by("created_at", direction="DESCENDING").limit(100)
    docs = list(query.stream())

    reviews = []
    for d in docs:
        data = _review_doc_to_dict(d)
        user = _fetch_user_summary(data.get("user_id", ""))
        data["user_name"] = user["full_name"]
        data["user_image"] = user["profile_image"]
        reviews.append(data)

    return {
        "reviews": reviews,
        "total": len(reviews),
    }


# ─── List Reviews by Current User ───────────────────────────
def get_my_reviews(user_id: str) -> dict:
    docs = (
        db.collection("reviews")
        .where("user_id", "==", user_id)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return {"reviews": [_review_doc_to_dict(d) for d in docs]}


# ─── Admin: List All Reviews ────────────────────────────────
def admin_list_reviews(
    hidden: Optional[bool] = None,
    station_id: Optional[str] = None,
    limit: int = 50,
) -> dict:
    query = db.collection("reviews")
    if hidden is not None:
        query = query.where("is_hidden", "==", hidden)
    if station_id:
        query = query.where("station_id", "==", station_id)

    query = query.order_by("created_at", direction="DESCENDING").limit(limit)
    docs = list(query.stream())

    reviews = []
    for d in docs:
        data = _review_doc_to_dict(d)
        user = _fetch_user_summary(data.get("user_id", ""))
        data["user_name"] = user["full_name"]
        # Also fetch station name
        station_id_val = data.get("station_id")
        if station_id_val:
            station_doc = db.collection("stations").document(station_id_val).get()
            if station_doc.exists:
                data["station_name"] = (station_doc.to_dict() or {}).get("name", "")
        reviews.append(data)

    return {"reviews": reviews, "total": len(reviews)}


# ─── Admin: Moderate Review ─────────────────────────────────
def admin_moderate_review(review_id: str, hidden: bool, reason: str, admin_id: str) -> dict:
    doc_ref = db.collection("reviews").document(review_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    review = doc.to_dict() or {}
    station_id = review.get("station_id")

    # Append to audit log
    audit_log = review.get("moderation_log", []) or []
    audit_log.append({
        "action": "hidden" if hidden else "unhidden",
        "reason": reason or "",
        "by": admin_id,
        "at": datetime.utcnow().isoformat(),
    })

    doc_ref.update({
        "is_hidden": hidden,
        "moderation_log": audit_log,
    })

    # Recalculate station rating (hidden reviews excluded)
    if station_id:
        _recompute_station_rating(station_id)

    return {
        "message": f"Review {'hidden' if hidden else 'unhidden'}",
        "review_id": review_id,
    }