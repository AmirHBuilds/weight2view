import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AdminUserRead(BaseModel):
    """Never includes password_hash - this is the only shape an AdminUser is ever returned in."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(default="admin", pattern="^(admin|super_admin)$")


class AdminUserUpdate(BaseModel):
    role: str | None = Field(default=None, pattern="^(admin|super_admin)$")
    is_active: bool | None = None


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=8)
