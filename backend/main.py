from __future__ import annotations
import os
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.api.routes import router as api_router

app = FastAPI(
    title="AI Inference Load Balancing Research API",
    description="A Workload-Aware Ant Colony Optimization Approach for Dynamic Load Balancing in AI Inference Systems",
    version="1.0.0",
)

# Enable CORS for local Next.js frontend communication (default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom validation error handler with clean readable messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "AI Inference Dynamic Load Balancing Simulation API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
