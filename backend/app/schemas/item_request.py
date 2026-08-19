import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ItemRequestCreate(BaseModel):
    # The ONLY thing a user provides - no scientific data.
    query_text: str = Field(min_length=1, max_length=300)


class ItemRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    query_text: str
    status: str
    resulting_item_id: uuid.UUID | None
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime


class ItemRequestUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(pending|approved|rejected|completed)$")
    admin_notes: str | None = None
    resulting_item_id: uuid.UUID | None = None
