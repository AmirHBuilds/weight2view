import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

ADMIN_ROLES = ("admin", "super_admin")


class AdminUser(Base):
    """
    An admin panel account. Roles are plain strings (not a DB enum type) so
    adding a role later is a data-only change - see ADMIN_ROLES above for
    the authoritative list, enforced via a check constraint in the
    migration.
    """

    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="admin")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sessions: Mapped[list["AdminSession"]] = relationship(
        back_populates="admin_user", cascade="all, delete-orphan"
    )


class AdminSession(Base):
    """
    A server-side session record backing the admin's HttpOnly cookie. The
    cookie itself only holds the opaque `token` - everything else (who,
    when it expires) lives here, so logout / deactivation / expiry can
    invalidate access immediately by deleting or ignoring this row, with no
    reliance on token-blocklists or waiting out a JWT's expiry.
    """

    __tablename__ = "admin_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False
    )
    # Opaque random token (see app/services/auth.py) - NOT a JWT, carries no
    # decodable claims itself, just a lookup key into this table.
    token: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    admin_user: Mapped["AdminUser"] = relationship(back_populates="sessions")
