from fastapi import APIRouter, Depends, Query
from middleware.auth_middleware import get_current_user
from schemas.station_schemas import StationRequest
import services.station_service as station_service
from schemas.station_schemas import StationRequest, RatingRequest

router = APIRouter(prefix="/stations", tags=["Stations"])




@router.get("/")
def get_stations(current_user: dict = Depends(get_current_user)):
    return station_service.get_all_stations()

@router.get("/public")
def public_stations(limit: int = 20, offset: int = 0):
    return station_service.get_public_stations(limit, offset)

@router.get("/public/search")
def public_search_stations(q: str = Query(..., min_length=1)):
    return station_service.public_search_stations(q)

@router.get("/public/{station_id}")
def public_station_detail(station_id: str):
    return station_service.get_station_by_id(station_id)

@router.get("/search")
def search_stations(q: str = Query(..., min_length=1), current_user: dict = Depends(get_current_user)):
    return station_service.search_stations(q)


@router.get("/{station_id}")
def get_station(station_id: str, current_user: dict = Depends(get_current_user)):
    return station_service.get_station_by_id(station_id)


@router.post("/")
def add_station(body: StationRequest, current_user: dict = Depends(get_current_user)):
    return station_service.add_station(body)

@router.post("/{station_id}/rate")
def rate_station(station_id: str, body: RatingRequest, current_user: dict = Depends(get_current_user)):
    return station_service.rate_station(station_id, current_user["sub"], body.rating)