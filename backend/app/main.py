from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine
from app.routers import applications, auth, match


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    logfire.configure(
        service_name="specfit-backend",
        send_to_logfire=settings.LOGFIRE_SEND_TO_LOGFIRE,  # type: ignore[arg-type]
        token=settings.LOGFIRE_TOKEN or None,
        environment=settings.APP_ENV,
    )
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx(capture_all=True)
    logfire.instrument_sqlalchemy(engine=engine.sync_engine)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="SpecFit API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    logfire.instrument_fastapi(app, capture_headers=False)

    app.include_router(auth.router)
    app.include_router(applications.router)
    app.include_router(match.router)

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
