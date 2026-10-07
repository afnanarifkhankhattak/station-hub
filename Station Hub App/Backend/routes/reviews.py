from fastapi import APIRouter, Depends, Query
from typing import Optional

from middleware.auth_middleware import get_current_user, RoleChecker
from schemas.review_schemas import ReviewCreateRequest, ReviewModerateRequest
import services.review_service as review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])


# ─── Public ─────────────────────────────────────────────────
@router.get("/station/{station_id}")
def list_station_reviews(station_id: str):
    """Public list of reviews for a station (hidden ones excluded)."""
    return review_service.get_station_reviews(station_id, include_hidden=False)


# ─── Customer ───────────────────────────────────────────────
@router.post("/")
def create_review(
    body: ReviewCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a review for a completed booking."""
    return review_service.create_review(body, current_user["sub"])


@router.get("/me")
def list_my_reviews(current_user: dict = Depends(get_current_user)):
    """List reviews written by the current user."""
    return review_service.get_my_reviews(current_user["sub"])


# ─── Admin ──────────────────────────────────────────────────
@router.get("/admin/list")
def admin_list_reviews(
    hidden: Optional[bool] = Query(None),
    station_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """Admin: list all reviews, optionally filtered."""
    return review_service.admin_list_reviews(
        hidden=hidden, station_id=station_id, limit=limit,
    )


@router.patch("/admin/{review_id}/moderate")
def admin_moderate_review(
    review_id: str,
    body: ReviewModerateRequest,
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """Admin: hide or unhide a review."""
    return review_service.admin_moderate_review(
        review_id, body.hidden, body.reason, current_user["sub"],
    )