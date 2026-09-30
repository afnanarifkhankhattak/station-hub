import asyncio
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routes import auth
from routes import profile
from routes import stations
from routes import bookings
from routes import settings
from routes import dashboard
from routes import services
from routes import booking_events
from services.booking_events import booking_events as booking_event_manager

app = FastAPI()


@app.on_event("startup")
async def configure_booking_events():
    booking_event_manager.set_event_loop(asyncio.get_running_loop())

app.add_middleware(GZipMiddleware, minimum_size=500)

# Comma-separated list, e.g.:
# CORS_ORIGINS=http://localhost:5173,https://your-dashboard.onrender.com
_cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(stations.router)
app.include_router(bookings.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(services.router) 
app.include_router(booking_events.router)


@app.get("/")
async def root():
    return {"message": "Station Hub API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
