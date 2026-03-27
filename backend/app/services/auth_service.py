import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.schemas.auth import AuthTokenOut, AuthUser, RegisterIn


def _encode_base64url(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _decode_base64url(value: str) -> dict:
    padding = "=" * (-len(value) % 4)
    return json.loads(base64.urlsafe_b64decode(f"{value}{padding}").decode("utf-8"))


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        settings.auth_password_iterations,
    )
    return f"pbkdf2_sha256${settings.auth_password_iterations}${salt}${base64.b64encode(digest).decode('utf-8')}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, encoded_digest = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    )
    return hmac.compare_digest(base64.b64encode(digest).decode("utf-8"), encoded_digest)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    header = {"alg": "HS256", "typ": "JWT"}
    body = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.auth_access_token_ttl_seconds)).timestamp()),
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


def decode_and_verify_jwt(token: str) -> dict:
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
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tipo de token invalido")
    return payload


def serialize_user(user: User) -> AuthUser:
    return AuthUser(id=user.id, name=user.name, email=user.email, role=user.role)


def build_auth_response(user: User, request_id: str | None) -> AuthTokenOut:
    return AuthTokenOut(
        access_token=create_access_token(user),
        token_type="Bearer",
        expires_in=settings.auth_access_token_ttl_seconds,
        requestId=request_id,
        user=serialize_user(user),
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalars(select(User).where(User.email == email.lower())).first()


def _is_duplicate_email_error(exc: IntegrityError) -> bool:
    message = str(exc.orig).lower()
    return "email" in message and (
        "unique" in message
        or "duplicate" in message
        or "ix_users_email" in message
        or "users.email" in message
    )


def create_user(db: Session, payload: RegisterIn, role: str = "admin") -> User:
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ja existe usuario com este email")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        role=role,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if _is_duplicate_email_error(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ja existe usuario com este email") from exc
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nao foi possivel salvar a conta no banco de dados.",
        ) from exc
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inativo")
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)
