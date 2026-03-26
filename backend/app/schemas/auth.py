from pydantic import BaseModel, EmailStr


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class AuthUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str


class LoginOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    auth_mode: str
    database_required: bool
    requestId: str | None = None
    user: AuthUser
