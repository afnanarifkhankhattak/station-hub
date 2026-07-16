from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.booking_events import booking_events
from utils.jwt_handler import verify_token

router = APIRouter(tags=["Booking events"])


@router.websocket("/booking-events")
async def booking_events_socket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    payload = verify_token(token or "")
    if not payload or not payload.get("sub"):
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    user_id = payload["sub"]
    await booking_events.connect(user_id, websocket)
    try:
        while True:
            # Keeps the connection open and allows future client heartbeats.
            await websocket.receive_text()
    except WebSocketDisconnect:
        booking_events.disconnect(user_id, websocket)
