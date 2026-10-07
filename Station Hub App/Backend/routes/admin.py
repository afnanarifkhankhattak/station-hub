"""
Admin-only routes.

All endpoints here require role = "admin" (enforced by RoleChecker).
"""
from fastapi import APIRouter, Depends

from middleware.auth_middleware import RoleChecker
import services.admin_service as admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Platform stats ─────────────────────────────────────────
@router.get("/stats")
def get_platform_stats(
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """Return platform-wide statistics for the Super Admin dashboard."""
    return admin_service.get_platform_stats()


# ─── Station listing ────────────────────────────────────────
@router.get("/stations")
def list_admin_stations(
    status: str | None = None,
    station_type: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """List all stations (with owner info) for admin review."""
    return admin_service.get_admin_stations(
        status=status,
        station_type=station_type,
        limit=limit,
        cursor=cursor,
    )


# ─── Station moderation ─────────────────────────────────────
@router.patch("/stations/{station_id}/status")
def update_station_status(
    station_id: str,
    body: dict,
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """
    Update a station's approval status.

    Body:
      {
        "status": "APPROVED" | "REJECTED" | "SUSPENDED" | "CHANGES_REQUESTED",
        "reason": "required for negative actions"
      }
    """
    return admin_service.update_station_status(
        station_id=station_id,
        new_status=body.get("status", ""),
        reason=body.get("reason", ""),
        admin_id=current_user["sub"],
    )


# ─── User listing ───────────────────────────────────────────
@router.get("/users")
def list_admin_users(
    role: str | None = None,
    status: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """
    List all users (customers, owners, admins) for the admin panel.

    Query params:
      - role:    Filter by role (user / station_owner / admin)
      - status:  Filter by status (ACTIVE / SUSPENDED / BLOCKED / PENDING)
      - limit:   Page size (1-100, default 20)
      - cursor:  Pagination cursor (last user ID)
    """
    return admin_service.get_admin_users(
        role=role,
        status=status,
        limit=limit,
        cursor=cursor,
    )


# ─── User moderation ────────────────────────────────────────
@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    body: dict,
    current_user: dict = Depends(RoleChecker(["admin"])),
):
    """
    Update a user's status.

    Body:
      {
        "status": "ACTIVE" | "SUSPENDED" | "BLOCKED",
        "reason": "required for SUSPENDED / BLOCKED"
      }
    """
    return admin_service.update_user_status(
        user_id=user_id,
        new_status=body.get("status", ""),
        reason=body.get("reason", ""),
        admin_id=current_user["sub"],
    )