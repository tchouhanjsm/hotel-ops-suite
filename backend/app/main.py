from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.guests import router as guests_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.staff import router as staff_router

app = FastAPI(
    title="Hotel Ops Suite API",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(staff_router)
app.include_router(rooms_router)
app.include_router(guests_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
