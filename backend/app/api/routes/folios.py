from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.rbac import require_permission
from app.models.folio import Folio, FolioItem
from app.models.staff import Staff
from app.schemas.folio import (
    FolioCreate,
    FolioItemCreate,
    FolioItemRead,
    FolioRead,
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
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:update")),  # noqa: B008
) -> Folio:
    try:
        folio = FolioService(db).create_folio(
            booking_id=data.booking_id,
            currency=data.currency,
            notes=data.notes,
        )
        db.commit()
        return folio
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/{folio_id}", response_model=FolioRead)
def get_folio(
    folio_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> Folio:
    folio = FolioService(db).get_folio(folio_id)

    if folio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folio not found.",
        )

    return folio


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
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:update")),  # noqa: B008
) -> FolioItem:
    try:
        item = FolioService(db).add_item(
            folio_id=folio_id,
            item_type=data.item_type.value,
            description=data.description,
            quantity=data.quantity,
            unit_price=data.unit_price,
            tax_percent=data.tax_percent,
        )
        db.commit()
        return item
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
