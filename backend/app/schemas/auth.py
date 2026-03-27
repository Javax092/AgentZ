from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, model_validator


class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(
        min_length=1,
        max_length=120,
        validation_alias=AliasChoices("name", "full_name", "fullName", "username"),
    )
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
        validation_alias=AliasChoices("confirm_password", "confirmPassword"),
    )

    @model_validator(mode="before")
    @classmethod
    def strip_string_values(cls, data):
        if not isinstance(data, dict):
            return data

        return {
            key: value.strip() if isinstance(value, str) else value
            for key, value in data.items()
        }

    @model_validator(mode="after")
    def validate_fields(self) -> "RegisterIn":
        if not self.name:
            raise ValueError("Informe o nome completo.")
        if not self.password.strip():
            raise ValueError("Informe uma senha valida.")
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("A confirmacao de senha nao confere.")
        return self


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="before")
    @classmethod
    def strip_string_values(cls, data):
        if not isinstance(data, dict):
            return data

        return {
            key: value.strip() if isinstance(value, str) else value
            for key, value in data.items()
        }


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
