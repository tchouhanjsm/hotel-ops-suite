from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.audit_log import AuditLog
from app.models.booking import Booking
from app.models.folio import Folio, FolioItem
from app.models.guest import Guest
from app.models.room import Room
from app.models.service_voucher import ServiceVoucher
from app.models.staff import Staff
from app.services.booking import BookingService
from app.services.folio import FolioService

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

Base.metadata.create_all(engine)


@pytest.fixture(autouse=True)
def clean_database() -> None:
    with Session(engine) as db:
        db.execute(delete(AuditLog))
        db.execute(delete(ServiceVoucher))
        db.execute(delete(FolioItem))
        db.execute(delete(Folio))
        db.execute(delete(Booking))
        db.execute(delete(Guest))
        db.execute(delete(Room))
        db.execute(delete(Staff))
        db.commit()


@pytest.fixture
def client():
    def override_get_db():
        with Session(engine) as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


def create_staff(role: str, username: str) -> Staff:
    with Session(engine) as db:
        staff = Staff(
            username=username,
            password_hash=hash_password("StrongPassword123!"),
            full_name=username.title(),
            role=role,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff


def create_folio() -> int:
    with Session(engine) as db:
        guest = Guest(
            first_name="Route",
            last_name="Test",
            phone="9000000001",
        )
        room = Room(
            room_number="301",
            room_name="Route Test Room",
            room_type="Heritage",
            floor=3,
            capacity=2,
        )

        db.add_all([guest, room])
        db.commit()
        db.refresh(guest)
        db.refresh(room)

        booking = BookingService(db).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2027, 7, 10),
            check_out=date(2027, 7, 12),
            rate=Decimal("4900.00"),
            source="direct",
            notes=None,
        )
        db.commit()

        folio = FolioService(db).create_folio(
            booking_id=booking.id,
            currency="INR",
            notes=None,
        )
        db.commit()
        db.refresh(folio)

        return folio.id


def test_create_service_voucher_route(client) -> None:
    staff = create_staff("front_desk", "sv_route")
    folio_id = create_folio()

    token = create_access_token(staff.id, staff.role)

    response = client.post(
        "/service-vouchers",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["status"] == "draft"
    assert body["currency"] == "INR"
    assert body["amount"] == "1700.00"
    assert body["tax_amount"] == "85.00"
    assert body["total_amount"] == "1785.00"


def test_list_and_detail_service_voucher_routes(client) -> None:
    staff = create_staff("front_desk", "sv_list")
    folio_id = create_folio()
    token = create_access_token(staff.id, staff.role)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/service-vouchers",
        headers=headers,
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    assert create_response.status_code == 201
    voucher_id = create_response.json()["id"]

    list_response = client.get(
        "/service-vouchers",
        headers=headers,
    )

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["id"] == voucher_id

    detail_response = client.get(
        f"/service-vouchers/{voucher_id}",
        headers=headers,
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == voucher_id


def test_update_service_voucher_route_records_audit(client) -> None:
    staff = create_staff("front_desk", "sv_update")
    folio_id = create_folio()
    token = create_access_token(staff.id, staff.role)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/service-vouchers",
        headers=headers,
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    voucher_id = create_response.json()["id"]

    response = client.patch(
        f"/service-vouchers/{voucher_id}",
        headers=headers,
        json={
            "quantity": "3.00",
            "unit_price": "900.00",
        },
    )

    assert response.status_code == 200

    body = response.json()
    assert body["quantity"] == "3.00"
    assert body["amount"] == "2700.00"
    assert body["tax_amount"] == "135.00"
    assert body["total_amount"] == "2835.00"

    with Session(engine) as db:
        audit = db.execute(
            select(AuditLog).where(
                AuditLog.action == "SERVICE_VOUCHER_UPDATED",
                AuditLog.entity_id == voucher_id,
            )
        ).scalar_one()

        assert audit.staff_id == staff.id
        assert audit.entity_type == "service_voucher"


def test_issue_service_voucher_route_creates_folio_item_and_audit(
    client,
) -> None:
    staff = create_staff("front_desk", "sv_issue")
    folio_id = create_folio()
    token = create_access_token(staff.id, staff.role)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/service-vouchers",
        headers=headers,
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    voucher_id = create_response.json()["id"]

    response = client.post(
        f"/service-vouchers/{voucher_id}/issue",
        headers=headers,
    )

    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "issued"
    assert body["folio_item_id"] is not None

    with Session(engine) as db:
        items = db.query(FolioItem).filter(
            FolioItem.folio_id == folio_id,
            FolioItem.item_type == "service",
        ).all()

        assert len(items) == 1
        assert items[0].id == body["folio_item_id"]

        audit = db.execute(
            select(AuditLog).where(
                AuditLog.action == "SERVICE_VOUCHER_ISSUED",
                AuditLog.entity_id == voucher_id,
            )
        ).scalar_one()

        assert audit.staff_id == staff.id


def test_cancel_service_voucher_route_voids_item_and_records_audit(
    client,
) -> None:
    staff = create_staff("manager", "sv_cancel")
    folio_id = create_folio()
    token = create_access_token(staff.id, staff.role)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/service-vouchers",
        headers=headers,
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    voucher_id = create_response.json()["id"]

    issue_response = client.post(
        f"/service-vouchers/{voucher_id}/issue",
        headers=headers,
    )

    assert issue_response.status_code == 200
    folio_item_id = issue_response.json()["folio_item_id"]

    response = client.post(
        f"/service-vouchers/{voucher_id}/cancel",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

    with Session(engine) as db:
        item = db.get(FolioItem, folio_item_id)

        assert item is not None
        assert item.status == "voided"

        audit = db.execute(
            select(AuditLog).where(
                AuditLog.action == "SERVICE_VOUCHER_CANCELLED",
                AuditLog.entity_id == voucher_id,
            )
        ).scalar_one()

        assert audit.staff_id == staff.id
        assert audit.entity_type == "service_voucher"


def test_front_desk_cannot_cancel_service_voucher(client) -> None:
    staff = create_staff("front_desk", "sv_no_void")
    folio_id = create_folio()
    token = create_access_token(staff.id, staff.role)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/service-vouchers",
        headers=headers,
        json={
            "voucher_date": "2027-07-10",
            "folio_id": folio_id,
            "service_category": "Tours",
            "service_name": "Desert Safari",
            "description": "Evening camel safari",
            "quantity": "2.00",
            "unit_price": "850.00",
            "tax_percent": "5.00",
            "notes": "Sunset departure",
        },
    )

    voucher_id = create_response.json()["id"]

    issue_response = client.post(
        f"/service-vouchers/{voucher_id}/issue",
        headers=headers,
    )

    assert issue_response.status_code == 200

    response = client.post(
        f"/service-vouchers/{voucher_id}/cancel",
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions."
