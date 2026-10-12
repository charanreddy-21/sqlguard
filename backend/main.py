import logging
import os
import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.database import get_analytics, initialize_database, save_prediction
from src.sqlguard.inference import predict_query

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def get_cors_origins(configured: str | None = None) -> list[str]:
    """Return exact origins from the environment, with local Vite defaults."""
    value = os.environ.get("SQLGUARD_CORS_ORIGINS") if configured is None else configured
    if value is None or not value.strip():
        return list(DEFAULT_CORS_ORIGINS)

    origins = [origin.strip() for origin in value.split(",") if origin.strip()]
    if "*" in origins:
        raise ValueError("SQLGUARD_CORS_ORIGINS must list exact origins; '*' is not allowed")
    return origins


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="SQLGuard API",
    description="ML-powered SQL injection detection API",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)


class PredictionRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10000)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SQLGuard API",
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        result = predict_query(request.query)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    try:
        save_prediction(request.query, result)
    except (sqlite3.Error, OSError) as exc:
        logger.exception("Could not persist prediction result")
        raise HTTPException(
            status_code=503,
            detail="Prediction completed, but its result could not be saved. Please retry.",
        ) from exc

    return result


@app.get("/analytics")
def analytics():
    try:
        return get_analytics()
    except (sqlite3.Error, OSError) as exc:
        logger.exception("Could not read prediction analytics")
        raise HTTPException(
            status_code=503,
            detail="Prediction analytics are temporarily unavailable.",
        ) from exc
