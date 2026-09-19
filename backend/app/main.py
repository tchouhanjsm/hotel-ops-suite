from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import domain_error_handler
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.routes.auth import router as auth_router
from app.api.routes.bookings import router as bookings_router
from app.api.routes.folios import router as folios_router
from app.api.routes.guests import router as guests_router
from app.api.routes.invoices import router as invoices_router
from app.api.routes.payments import router as payments_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.staff import router as staff_router
from app.core.errors import DomainError

app = FastAPI(
    title="Hotel Ops Suite API",
    version="0.1.0",
)

app.add_exception_handler(DomainError, domain_error_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(audit_logs_router)
app.include_router(staff_router)
app.include_router(rooms_router)
app.include_router(guests_router)
app.include_router(bookings_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(folios_router)
app.include_router(invoices_router)
app.include_router(payments_router)
