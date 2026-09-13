from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthenticatedStaff(BaseModel):
    id: int
    username: str
    full_name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    staff: AuthenticatedStaff
