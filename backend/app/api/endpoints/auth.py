import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.config import settings
from app.schemas.auth import AuthUser, LoginIn, LoginOut, RefreshIn

router = APIRouter()
ACCESS_TOKEN_TTL_SECONDS = 3600
REFRESH_TOKEN_TTL_SECONDS = 604800


def _encode_base64url(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _decode_base64url(value: str) -> dict:
    padding = "=" * (-len(value) % 4)
    return json.loads(base64.urlsafe_b64decode(f"{value}{padding}").decode("utf-8"))


def _create_jwt(payload: dict, expires_in_seconds: int) -> str:
    now = datetime.now(timezone.utc)
    header = {"alg": "HS256", "typ": "JWT"}
    body = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in_seconds)).timestamp()),
        "iss": "leadflow-auth",
        "aud": "leadflow-web",
    }
    encoded_header = _encode_base64url(header)
    encoded_payload = _encode_base64url(body)
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = base64.urlsafe_b64encode(
        hmac.new(settings.auth_jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")
    return f"{encoded_header}.{encoded_payload}.{signature}"


def _verify_jwt(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Formato de token invalido")

    encoded_header, encoded_payload, signature = parts
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    expected_signature = base64.urlsafe_b64encode(
        hmac.new(settings.auth_jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Assinatura invalida")

    payload = _decode_base64url(encoded_payload)
    exp = payload.get("exp")
    if not isinstance(exp, int) or datetime.now(timezone.utc).timestamp() >= exp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")

    return payload


def _build_user(email: str) -> AuthUser:
    return AuthUser(id="demo-admin", name="Admin Demo", email=email, role="admin")


def _build_auth_response(email: str, request_id: str, refresh_token: str | None = None) -> LoginOut:
    user = _build_user(email)
    access_token = _create_jwt(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "type": "access",
            "mode": "demo",
        },
        ACCESS_TOKEN_TTL_SECONDS,
    )
    stable_refresh_token = refresh_token or _create_jwt(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "type": "refresh",
            "mode": "demo",
        },
        REFRESH_TOKEN_TTL_SECONDS,
    )
    return LoginOut(
        access_token=access_token,
        refresh_token=stable_refresh_token,
        token_type="Bearer",
        expires_in=ACCESS_TOKEN_TTL_SECONDS,
        auth_mode="demo",
        database_required=False,
        requestId=request_id,
        user=user,
    )


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, request: Request) -> LoginOut:
    if payload.email.lower() != settings.demo_email.lower() or payload.password != settings.demo_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas")

    return _build_auth_response(payload.email, getattr(request.state, "request_id", "n/a"))


@router.post("/refresh", response_model=LoginOut)
def refresh(payload: RefreshIn, request: Request) -> LoginOut:
    token_payload = _verify_jwt(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tipo de token invalido")

    return _build_auth_response(
        str(token_payload.get("email") or settings.demo_email),
        getattr(request.state, "request_id", "n/a"),
        payload.refresh_token,
    )


@router.get("/me", response_model=AuthUser)
def me(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Header Authorization invalido")

    payload = _verify_jwt(token)
    return _build_user(str(payload.get("email") or settings.demo_email))
