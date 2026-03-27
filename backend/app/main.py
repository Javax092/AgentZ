import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.db.seed import seed_database
from app.db.session import SessionLocal, verify_database_connection

logger = logging.getLogger("leadflow-api")


def _humanize_validation_message(field: str, error: dict) -> str:
    error_type = error.get("type", "")
    if field == "email" and error_type.startswith("value_error"):
        return "Informe um email valido."
    if error_type == "extra_forbidden":
        return f"O campo '{field}' nao e aceito nesta rota."
    if error_type == "missing":
        return f"O campo '{field}' e obrigatorio."
    if error_type == "string_too_short":
        if field in {"password", "confirm_password", "confirmPassword"}:
            return "A senha deve ter pelo menos 8 caracteres."
        return f"O campo '{field}' nao pode ficar vazio."
    if error_type == "value_error":
        context = error.get("ctx", {})
        raw_message = context.get("error")
        if raw_message:
            return str(raw_message)
    if error_type == "value_error.email":
        return "Informe um email valido."
    return error.get("msg", "Valor invalido.")


def _format_validation_errors(exc: RequestValidationError) -> list[dict[str, str]]:
    formatted_errors: list[dict[str, str]] = []
    for error in exc.errors():
        location = [str(item) for item in error.get("loc", []) if item != "body"]
        field = ".".join(location) if location else "body"
        formatted_errors.append(
            {
                "field": field,
                "message": _humanize_validation_message(field, error),
                "type": error.get("type", "validation_error"),
            }
        )
    return formatted_errors


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("validating_database_connection")
    try:
        verify_database_connection()
    except Exception:
        logger.exception("database_connection_validation_failed")
        raise

    db = SessionLocal()
    try:
        logger.info("running_startup_seed")
        seed_database(db)
    except Exception:
        logger.exception("startup_seed_failed")
        raise
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
    if isinstance(exc.detail, dict):
        payload = {"error": "http_error", "requestId": request_id, **exc.detail}
        payload.setdefault("message", "Falha na API.")
        return JSONResponse(status_code=exc.status_code, content=payload)

    detail = exc.detail if isinstance(exc.detail, str) else "Falha na API."
    return JSONResponse(status_code=exc.status_code, content={"error": "http_error", "message": detail, "requestId": request_id})


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "n/a")
    errors = _format_validation_errors(exc)
    message = errors[0]["message"] if errors else "Payload invalido."
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": message,
            "requestId": request_id,
            "errors": errors,
        },
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
