from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from schemas.settings_schemas import (
    ShopInfoRequest,
    AvailabilityRequest,
    ThemeRequest,
    CategoryRequest,
)
import services.settings_service as settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/")
def get_settings(current_user: dict = Depends(get_current_user)):
    return settings_service.get_settings(current_user["sub"])


@router.put("/shop-info")
def update_shop_info(
    body: ShopInfoRequest,
    current_user: dict = Depends(get_current_user)
):
    return settings_service.update_section(body, current_user["sub"])


@router.put("/availability")
def update_availability(
    body: AvailabilityRequest,
    current_user: dict = Depends(get_current_user)
):
    return settings_service.update_section(body, current_user["sub"])


@router.put("/theme")
def update_theme(
    body: ThemeRequest,
    current_user: dict = Depends(get_current_user)
):
    return settings_service.update_section(body, current_user["sub"])


@router.get("/categories")
def get_categories(current_user: dict = Depends(get_current_user)):
    return settings_service.get_categories()


@router.post("/categories")
def add_category(
    body: CategoryRequest,
    current_user: dict = Depends(get_current_user)
):
    return settings_service.add_category(body.name)