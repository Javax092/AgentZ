from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AuthUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    requestId: str | None = None
    user: AuthUser
