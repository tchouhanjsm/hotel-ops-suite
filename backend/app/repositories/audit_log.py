from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.staff import Staff


class AuditLogRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        staff_id: int,
        action: str,
        entity_type: str,
        entity_id: int | None,
        details: dict | None,
        ip_address: str | None,
        user_agent: str | None,
    ) -> AuditLog:
        log = AuditLog(
            staff_id=staff_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def list(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[tuple[AuditLog, Staff]]:
        statement = (
            select(AuditLog, Staff)
            .join(Staff, Staff.id == AuditLog.staff_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = self.db.execute(statement)

        return [(row[0], row[1]) for row in result]
