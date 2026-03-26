import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base, ensure_runtime_schema
from app.db.seed import seed_database
from app.db.session import SessionLocal, engine

logger = logging.getLogger("leadflow-api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.middleware("http")
async def add_request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    started_at = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled_request_error")
        raise

    response.headers["x-request-id"] = request_id
    if settings.app_env == "development":
        logger.info(
            "http_request %s %s %s %.1fms",
            request.method,
            request.url.path,
            response.status_code,
            (time.perf_counter() - started_at) * 1000,
        )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "n/a")
    detail = exc.detail if isinstance(exc.detail, str) else "Falha na API."
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": detail, "requestId": request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, _: Exception):
    request_id = getattr(request.state, "request_id", "n/a")
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "Erro interno nao tratado.", "requestId": request_id},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
