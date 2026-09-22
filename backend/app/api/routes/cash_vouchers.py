from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.cash_voucher import CashVoucher
from app.models.staff import Staff
from app.schemas.cash_voucher import (
    CashVoucherCreate,
    CashVoucherRead,
    CashVoucherStatus,
    CashVoucherUpdate,
)
from app.services.cash_voucher import CashVoucherService

router = APIRouter(prefix="/cash-vouchers", tags=["Cash Vouchers"])


@router.get("", response_model=list[CashVoucherRead])
def list_cash_vouchers(
    voucher_status: CashVoucherStatus | None = None,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("cash_voucher:read")),  # noqa: B008
) -> list[CashVoucher]:
    return CashVoucherService(db).list_vouchers(
        status=voucher_status.value if voucher_status else None,
    )


@router.post(
    "",
    response_model=CashVoucherRead,
    status_code=status.HTTP_201_CREATED,
)
def create_cash_voucher(
    data: CashVoucherCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(
        require_permission("cash_voucher:create"),
    ),  # noqa: B008
) -> CashVoucher:
    voucher = CashVoucherService(db).create_voucher(
        voucher_date=data.voucher_date,
        payee_name=data.payee_name,
        expense_category=data.expense_category,
        description=data.description,
        amount=data.amount,
        currency=data.currency,
        external_reference=data.external_reference,
        notes=data.notes,
        created_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="CASH_VOUCHER_CREATED",
        entity_type="cash_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "payee_name": voucher.payee_name,
            "expense_category": voucher.expense_category,
            "amount": str(voucher.amount),
            "currency": voucher.currency,
        },
    )
    db.commit()
    return voucher


@router.get("/{voucher_id}", response_model=CashVoucherRead)
def get_cash_voucher(
    voucher_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("cash_voucher:read")),  # noqa: B008
) -> CashVoucher:
    voucher = CashVoucherService(db).get_voucher(voucher_id)

    if voucher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cash voucher not found.",
        )

    return voucher


@router.patch("/{voucher_id}", response_model=CashVoucherRead)
def update_cash_voucher(
    voucher_id: int,
    data: CashVoucherUpdate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(
        require_permission("cash_voucher:update"),
    ),  # noqa: B008
) -> CashVoucher:
    voucher = CashVoucherService(db).update_voucher(
        voucher_id,
        data.model_dump(exclude_unset=True),
        updated_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="CASH_VOUCHER_UPDATED",
        entity_type="cash_voucher",
        entity_id=voucher.id,
        details={"voucher_number": voucher.voucher_number},
    )
    db.commit()
    return voucher


@router.post("/{voucher_id}/cancel", response_model=CashVoucherRead)
def cancel_cash_voucher(
    voucher_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(
        require_permission("cash_voucher:void"),
    ),  # noqa: B008
) -> CashVoucher:
    voucher = CashVoucherService(db).cancel_voucher(
        voucher_id,
        cancelled_by=current_staff.id,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="CASH_VOUCHER_CANCELLED",
        entity_type="cash_voucher",
        entity_id=voucher.id,
        details={
            "voucher_number": voucher.voucher_number,
            "amount": str(voucher.amount),
            "currency": voucher.currency,
        },
    )
    db.commit()
    return voucher
