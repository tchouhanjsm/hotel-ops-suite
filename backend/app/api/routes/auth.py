from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.security import create_access_token
from app.schemas.auth import AuthenticatedStaff, LoginRequest, LoginResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> LoginResponse:
    staff = AuthService(db).authenticate(
        username=data.username,
        password=data.password,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token(
        staff_id=staff.id,
        role=staff.role,
    )

    return LoginResponse(
        access_token=token,
        staff=AuthenticatedStaff(
            id=staff.id,
            username=staff.username,
            full_name=staff.full_name,
            role=staff.role,
        ),
    )
