import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("perf")


class TimingMiddleware(BaseHTTPMiddleware):
    """Logs request duration and adds X-Response-Time-Ms header.
    
    Thresholds:
    - < 200ms: INFO (normal)
    - >= 200ms: WARNING (slow — investigate)
    """
    async def dispatch(self, request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        level = "WARNING" if elapsed_ms > 200 else "INFO"
        logger.log(
            getattr(logging, level),
            f"{request.method} {request.url.path} → {elapsed_ms:.0f}ms"
        )
        response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.0f}"
        return response
