import logging
import sys
import time
from pythonjsonlogger import jsonlogger
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "status", "path"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["method", "path"])


def setup_logging() -> None:
    log_format = "%(asctime)s %(levelname)s %(name)s %(message)s"
    formatter = jsonlogger.JsonFormatter(log_format)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        path = request.url.path
        status = str(response.status_code)
        REQUEST_COUNT.labels(method=request.method, status=status, path=path).inc()
        REQUEST_LATENCY.labels(method=request.method, path=path).observe(duration)
        return response


def setup_metrics(app) -> None:
    app.add_middleware(MetricsMiddleware)

    @app.get("/metrics")
    def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
