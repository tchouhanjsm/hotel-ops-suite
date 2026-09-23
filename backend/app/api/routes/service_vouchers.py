from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.service_voucher import ServiceVoucher
from app.models.staff import Staff
from app.schemas.service_voucher import (
    ServiceVoucherCreate,
    ServiceVoucherRead,
    ServiceVoucherStatus,
    ServiceVoucherUpdate,
)
from app.services.service_voucher import ServiceVoucherService

router = APIRouter(
    prefix="/service-vouchers",
    tags=["Service Vouchers"],
)


@router.get("", response_model=list[ServiceVoucherRead])
def list_service_vouchers(
    voucher_status: ServiceVoucherStatus | None = None,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("service_voucher:read")),  # noqa: B008
) -> list[ServiceVoucher]:
    return ServiceVoucherService(db).list_vouchers(
        status=voucher_status.value if voucher_status else None,
    )


@router.post(
    "",
    response_model=ServiceVoucherRead,
    status_code=status.HTTP_201_CREATED,
)
def create_service_voucher(
    data: ServiceVoucherCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("service_voucher:create")),  # noqa: B008
) -> ServiceVoucher:
    voucher = ServiceVoucherService(db).create_voucher(
        voucher_date=data.voucher_date,
        folio_id=data.folio_id,
        service_category=data.service_category,
        service_name=data.service_name,
        description=data.description,
        quantity=data.quantity,
        unit_price=data.unit_price,
        tax_percent=data.tax_percent,
        notes=data.notes,
        created_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="SERVICE_VOUCHER_CREATED",
        entity_type="service_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "folio_id": voucher.folio_id,
            "service_name": voucher.service_name,
            "total_amount": str(voucher.total_amount),
        },
    )
    db.commit()
    return voucher


@router.get("/{voucher_id}", response_model=ServiceVoucherRead)
def get_service_voucher(
    voucher_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("service_voucher:read")),  # noqa: B008
) -> ServiceVoucher:
    voucher = ServiceVoucherService(db).get_voucher(voucher_id)

    if voucher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service voucher not found.",
        )

    return voucher


@router.patch("/{voucher_id}", response_model=ServiceVoucherRead)
def update_service_voucher(
    voucher_id: int,
    data: ServiceVoucherUpdate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("service_voucher:update")),  # noqa: B008
) -> ServiceVoucher:
    voucher = ServiceVoucherService(db).update_voucher(
        voucher_id,
        data.model_dump(exclude_unset=True),
    )

    record_audit(
        db,
        request,
        current_staff,
        action="SERVICE_VOUCHER_UPDATED",
        entity_type="service_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "folio_id": voucher.folio_id,
        },
    )
    db.commit()
    return voucher


@router.post("/{voucher_id}/issue", response_model=ServiceVoucherRead)
def issue_service_voucher(
    voucher_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("service_voucher:issue")),  # noqa: B008
) -> ServiceVoucher:
    voucher = ServiceVoucherService(db).issue_voucher(
        voucher_id,
        issued_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="SERVICE_VOUCHER_ISSUED",
        entity_type="service_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "folio_id": voucher.folio_id,
            "folio_item_id": voucher.folio_item_id,
            "total_amount": str(voucher.total_amount),
        },
    )
    db.commit()
    return voucher


@router.post("/{voucher_id}/cancel", response_model=ServiceVoucherRead)
def cancel_service_voucher(
    voucher_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("service_voucher:void")),  # noqa: B008
) -> ServiceVoucher:
    voucher = ServiceVoucherService(db).cancel_voucher(
        voucher_id,
        cancelled_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="SERVICE_VOUCHER_CANCELLED",
        entity_type="service_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "folio_id": voucher.folio_id,
            "folio_item_id": voucher.folio_item_id,
        },
    )
    db.commit()
    return voucher
