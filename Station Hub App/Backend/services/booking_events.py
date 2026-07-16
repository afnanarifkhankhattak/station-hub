"""In-process delivery of booking status events to connected mobile clients."""
import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket


class BookingEventManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)

    async def _send(self, user_id: str, payload: dict[str, Any]) -> None:
        for websocket in list(self._connections.get(user_id, set())):
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(user_id, websocket)

    def publish(self, user_id: str, booking_id: str, new_status: str) -> dict[str, str]:
        timestamp = datetime.now(timezone.utc).isoformat()
        messages = {
            "pending": "Booking created",
            "confirmed": "Booking approved",
            "rejected": "Booking declined",
            "cancelled": "Booking cancelled",
            "completed": "Service completed",
        }
        payload = {
            "type": "booking_status_change",
            "event_id": f"{booking_id}:{new_status}:{timestamp}",
            "booking_id": booking_id,
            "new_status": new_status,
            "timestamp": timestamp,
            "message": messages.get(new_status, "Booking updated"),
        }
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._send(user_id, payload), self._loop)
        return payload


booking_events = BookingEventManager()
