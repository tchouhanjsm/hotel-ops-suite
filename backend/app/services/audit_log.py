from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_log import AuditLogRepository


class AuditLogService:
    def __init__(self, db: Session) -> None:
        self.repository = AuditLogRepository(db)

    def log(
        self,
        *,
        staff_id: int,
        action: str,
        entity_type: str,
        entity_id: int | None = None,
        details: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        return self.repository.create(
            staff_id=staff_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def list_logs(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        rows = self.repository.list(limit=limit, offset=offset)

        return [
            {
                "id": log.id,
                "staff_id": log.staff_id,
                "staff_username": staff.username,
                "staff_name": staff.full_name,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at,
            }
            for log, staff in rows
        ]
