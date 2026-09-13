from fastapi import FastAPI

from app.api.routes.auth import router as auth_router

app = FastAPI(
    title="Hotel Ops Suite API",
    version="0.1.0",
)

app.include_router(auth_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
