import base64
import hashlib
import hmac
import json
from collections.abc import Generator
from datetime import datetime, timezone

from fastapi import Header, HTTPException, status

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _decode_base64url(value: str) -> dict:
    padding = "=" * (-len(value) % 4)
    return json.loads(base64.urlsafe_b64decode(f"{value}{padding}").decode("utf-8"))


def _verify_jwt(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Formato de token invalido")

    encoded_header, encoded_payload, signature = parts
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    expected_signature = base64.urlsafe_b64encode(
        hmac.new(settings.auth_jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")

    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Assinatura invalida")

    payload = _decode_base64url(encoded_payload)
    exp = payload.get("exp")
    if not isinstance(exp, int):
        raise ValueError("Token sem expiracao")
    if datetime.now(timezone.utc).timestamp() >= exp:
        raise ValueError("Token expirado")

    return payload


def require_authenticated_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Header Authorization invalido")

    if token == "demo-token":
        return {
            "sub": "demo-admin",
            "email": settings.demo_email,
            "name": "Admin Demo",
            "role": "admin",
            "mode": "demo",
        }

    try:
        payload = _verify_jwt(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("type") not in {None, "access"}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tipo de token invalido")

    return payload
