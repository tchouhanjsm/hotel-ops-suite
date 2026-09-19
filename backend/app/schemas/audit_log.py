from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    id: int
    staff_id: int
    staff_username: str
    staff_name: str
    action: str
    entity_type: str
    entity_id: int | None
    details: dict[str, Any] | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
