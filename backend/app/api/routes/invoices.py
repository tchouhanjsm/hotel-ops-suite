from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.invoice import Invoice, InvoiceItem
from app.models.staff import Staff
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceItemRead,
    InvoiceRead,
    InvoiceStatus,
)
from app.services.invoice import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("", response_model=list[InvoiceRead])
def list_invoices(
    invoice_status: InvoiceStatus | None = None,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("invoice:read")),  # noqa: B008
) -> list[Invoice]:
    return InvoiceService(db).list_invoices(
        status=invoice_status.value if invoice_status else None,
    )


@router.post(
    "",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    data: InvoiceCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("invoice:create")),  # noqa: B008
) -> Invoice:
    invoice = InvoiceService(db).create_draft(
        folio_id=data.folio_id,
        notes=data.notes,
    )

    record_audit(
        db,
        request,
        current_staff,
        action="CREATE_INVOICE_DRAFT",
        entity_type="invoice",
        entity_id=invoice.id,
        details={
            "invoice_number": invoice.invoice_number,
            "folio_id": invoice.folio_id,
        },
    )

    db.commit()
    return invoice


@router.get("/folio/{folio_id}", response_model=InvoiceRead)
def get_invoice_by_folio(
    folio_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("invoice:read")),  # noqa: B008
) -> Invoice:
    invoice = InvoiceService(db).get_invoice_by_folio(folio_id)

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    return invoice


@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("invoice:read")),  # noqa: B008
) -> Invoice:
    invoice = InvoiceService(db).get_invoice(invoice_id)

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    return invoice


@router.get(
    "/{invoice_id}/items",
    response_model=list[InvoiceItemRead],
)
def list_invoice_items(
    invoice_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("invoice:read")),  # noqa: B008
) -> list[InvoiceItem]:
    return InvoiceService(db).list_items(invoice_id)


@router.post(
    "/{invoice_id}/finalize",
    response_model=InvoiceRead,
)
def finalize_invoice(
    invoice_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("invoice:finalize")),  # noqa: B008
) -> Invoice:
    invoice = InvoiceService(db).finalize_invoice(
        invoice_id=invoice_id,
        finalized_by=current_staff.id,
    )
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="INVOICE_FINALIZED",
        entity_type="invoice",
        entity_id=invoice.id,
        details={
            "invoice_number": invoice.invoice_number,
            "folio_id": invoice.folio_id,
            "grand_total": str(invoice.grand_total),
            "paid_amount": str(invoice.paid_amount),
            "balance_due": str(invoice.balance_due),
        },
    )

    db.commit()
    return invoice


@router.post(
    "/{invoice_id}/void",
    response_model=InvoiceRead,
)
def void_invoice(
    invoice_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("invoice:void")),  # noqa: B008
) -> Invoice:
    invoice = InvoiceService(db).void_invoice(invoice_id)
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="VOID_INVOICE",
        entity_type="invoice",
        entity_id=invoice.id,
        details={
            "invoice_number": invoice.invoice_number,
            "folio_id": invoice.folio_id,
        },
    )

    db.commit()
    return invoice
