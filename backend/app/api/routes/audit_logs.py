from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.rbac import require_permission
from app.models.staff import Staff
from app.schemas.audit_log import AuditLogRead
from app.services.audit_log import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("audit:read")),  # noqa: B008
) -> list[dict]:
    return AuditLogService(db).list_logs(
        limit=limit,
        offset=offset,
    )
