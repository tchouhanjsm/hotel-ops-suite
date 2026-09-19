from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.payment import Payment
from app.models.staff import Staff
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services.payment import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get(
    "/folio/{folio_id}",
    response_model=list[PaymentRead],
)
def list_payments(
    folio_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("payment:read")),  # noqa: B008
) -> list[Payment]:
    try:
        return PaymentService(db).list_payments(folio_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    data: PaymentCreate,
    request: Request,
    current_staff: Staff = Depends(require_permission("payment:create")),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> Payment:
    try:
        payment = PaymentService(db).create_payment(
            folio_id=data.folio_id,
            amount=data.amount,
            payment_method=data.payment_method.value,
            received_by=current_staff.id,
            external_reference=data.external_reference,
            notes=data.notes,
        )
        record_audit(
            db,
            request,
            current_staff,
            action="CREATE_PAYMENT",
            entity_type="payment",
            entity_id=payment.id,
            details={
                "payment_reference": payment.payment_reference,
                "folio_id": payment.folio_id,
                "amount": str(payment.amount),
                "payment_method": payment.payment_method,
            },
        )
        db.commit()
        return payment
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{payment_id}/void",
    response_model=PaymentRead,
)
def void_payment(
    payment_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("payment:void")),  # noqa: B008
) -> Payment:
    try:
        payment = PaymentService(db).void_payment(payment_id)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="VOID_PAYMENT",
        entity_type="payment",
        entity_id=payment.id,
        details={
            "payment_reference": payment.payment_reference,
            "folio_id": payment.folio_id,
            "amount": str(payment.amount),
        },
    )
    db.commit()
    return payment
