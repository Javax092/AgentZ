from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import AuthTokenOut, AuthUser, LoginIn, RegisterIn
from app.services.auth_service import authenticate_user, build_auth_response, create_user, serialize_user

router = APIRouter()

@router.post("/register", response_model=AuthTokenOut)
def register(payload: RegisterIn, request: Request, db: Session = Depends(get_db)) -> AuthTokenOut:
    user = create_user(db, payload)
    return build_auth_response(user, getattr(request.state, "request_id", "n/a"))


@router.post("/login", response_model=AuthTokenOut)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)) -> AuthTokenOut:
    user = authenticate_user(db, payload.email, payload.password)
    return build_auth_response(user, getattr(request.state, "request_id", "n/a"))


@router.get("/me", response_model=AuthUser)
def me(user=Depends(get_current_user)) -> AuthUser:
    return serialize_user(user)
