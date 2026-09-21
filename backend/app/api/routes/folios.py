from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.folio import FolioItem
from app.models.staff import Staff
from app.schemas.folio import (
    FolioCreate,
    FolioItemCreate,
    FolioItemRead,
    FolioRead,
    FolioStatus,
    FolioSummary,
)
from app.services.folio import FolioService

router = APIRouter(prefix="/folios", tags=["Folios"])


@router.post(
    "",
    response_model=FolioRead,
    status_code=status.HTTP_201_CREATED,
)
def create_folio(
    data: FolioCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:update")),  # noqa: B008
) -> FolioRead:
    service = FolioService(db)
    folio = service.create_folio(
        booking_id=data.booking_id,
        currency=data.currency,
        notes=data.notes,
    )
    subtotal, tax_total, grand_total = service.get_totals(folio.id)

    record_audit(
        db,
        request,
        current_staff,
        action="CREATE_FOLIO",
        entity_type="folio",
        entity_id=folio.id,
        details={
            "folio_number": folio.folio_number,
            "booking_id": folio.booking_id,
        },
    )
    db.commit()

    return FolioRead(
        id=folio.id,
        folio_number=folio.folio_number,
        booking_id=folio.booking_id,
        status=FolioStatus(folio.status),
        currency=folio.currency,
        notes=folio.notes,
        created_at=folio.created_at,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
    )


@router.get(
    "/booking/{booking_id}",
    response_model=FolioSummary,
)
def get_folio_by_booking(
    booking_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> FolioSummary:
    service = FolioService(db)
    folio = service.get_folio_by_booking(booking_id)

    if folio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folio not found.",
        )

    subtotal, tax_total, grand_total = service.get_totals(folio.id)
    paid_amount, balance_due = service.get_balance(folio.id)

    return FolioSummary(
        id=folio.id,
        folio_number=folio.folio_number,
        booking_id=folio.booking_id,
        status=FolioStatus(folio.status),
        currency=folio.currency,
        notes=folio.notes,
        created_at=folio.created_at,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
        paid_amount=paid_amount,
        balance_due=balance_due,
    )


@router.get("/{folio_id}", response_model=FolioSummary)
def get_folio(
    folio_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> FolioSummary:
    service = FolioService(db)
    folio = service.get_folio(folio_id)

    if folio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folio not found.",
        )

    subtotal, tax_total, grand_total = service.get_totals(folio_id)
    paid_amount, balance_due = service.get_balance(folio_id)

    return FolioSummary(
        id=folio.id,
        folio_number=folio.folio_number,
        booking_id=folio.booking_id,
        status=FolioStatus(folio.status),
        currency=folio.currency,
        notes=folio.notes,
        created_at=folio.created_at,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
        paid_amount=paid_amount,
        balance_due=balance_due,
    )


@router.get(
    "/{folio_id}/items",
    response_model=list[FolioItemRead],
)
def list_folio_items(
    folio_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> list[FolioItem]:
    service = FolioService(db)

    if service.get_folio(folio_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folio not found.",
        )

    return service.list_items(folio_id)


@router.post(
    "/{folio_id}/items",
    response_model=FolioItemRead,
    status_code=status.HTTP_201_CREATED,
)
def add_folio_item(
    folio_id: int,
    data: FolioItemCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:update")),  # noqa: B008
) -> FolioItem:
    item = FolioService(db).add_item(
        folio_id=folio_id,
        item_type=data.item_type.value,
        description=data.description,
        quantity=data.quantity,
        unit_price=data.unit_price,
        tax_percent=data.tax_percent,
    )
    record_audit(
        db,
        request,
        current_staff,
        action="ADD_FOLIO_ITEM",
        entity_type="folio_item",
        entity_id=item.id,
        details={
            "folio_id": item.folio_id,
            "item_type": item.item_type,
            "description": item.description,
            "total_amount": str(item.total_amount),
        },
    )
    db.commit()
    return item
