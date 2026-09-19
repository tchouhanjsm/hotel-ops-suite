from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.staff import Staff
from app.services.audit_log import AuditLogService


def record_audit(
    db: Session,
    request: Request,
    staff: Staff,
    *,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: dict | None = None,
) -> AuditLog:
    return AuditLogService(db).log(
        staff_id=staff.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
