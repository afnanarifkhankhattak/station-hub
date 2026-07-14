from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from schemas.favorite_schemas import FavoriteRequest
import services.favorite_service as favorite_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("/")
def add_favorite(body: FavoriteRequest, current_user: dict = Depends(get_current_user)):
    return favorite_service.add_favorite(body.service_id, body.tier, current_user["sub"])


@router.delete("/{service_id}/{tier}")
def remove_favorite(service_id: str, tier: str, current_user: dict = Depends(get_current_user)):
    return favorite_service.remove_favorite(service_id, tier, current_user["sub"])


@router.get("/")
def get_favorites(current_user: dict = Depends(get_current_user)):
    return favorite_service.get_favorites(current_user["sub"])