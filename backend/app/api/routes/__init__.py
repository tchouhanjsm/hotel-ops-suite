from app.api.routes.auth import router as auth_router
from app.api.routes.guests import router as guests_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.staff import router as staff_router

__all__ = ["auth_router", "guests_router", "rooms_router", "staff_router"]
