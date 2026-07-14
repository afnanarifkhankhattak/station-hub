from fastapi import APIRouter, Depends, Query
from middleware.auth_middleware import get_current_user
from schemas.station_schemas import StationRequest
import services.station_service as station_service
from schemas.station_schemas import StationRequest, RatingRequest

router = APIRouter(prefix="/stations", tags=["Stations"])




@router.get("/")
async def get_stations(current_user: dict = Depends(get_current_user)):
    return await station_service.get_all_stations()

@router.get("/public")
async def public_stations(limit: int = 20, offset: int = 0):
    return await station_service.get_public_stations(limit, offset)

@router.get("/public/search")
async def public_search_stations(q: str = Query(..., min_length=1)):
    return await station_service.public_search_stations(q)

@router.get("/public/{station_id}")
async def public_station_detail(station_id: str):
    return await station_service.get_station_by_id(station_id)

@router.get("/search")
async def search_stations(q: str = Query(..., min_length=1), current_user: dict = Depends(get_current_user)):
    return await station_service.search_stations(q)


@router.get("/{station_id}")
async def get_station(station_id: str, current_user: dict = Depends(get_current_user)):
    return await station_service.get_station_by_id(station_id)


@router.post("/")
async def add_station(body: StationRequest, current_user: dict = Depends(get_current_user)):
    return await station_service.add_station(body)

@router.post("/{station_id}/rate")
async def rate_station(station_id: str, body: RatingRequest, current_user: dict = Depends(get_current_user)):
    return await station_service.rate_station(station_id, current_user["sub"], body.rating)