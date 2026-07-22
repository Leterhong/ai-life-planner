"""AI Life Planner Agent - Main Application Entry Point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import settings
from database import init_db
from routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database on startup."""
    await init_db()
    # Store background tasks on app state to prevent GC
    app.state.background_tasks = set()
    print("=" * 60)
    print("  AI Life Planner Agent - Backend Started")
    print(f"  Server: http://{settings.APP_HOST}:{settings.APP_PORT}")
    print(f"  Model: {settings.SEED_MODEL}")
    print("=" * 60)
    yield


app = FastAPI(
    title="AI Life Planner Agent",
    description="基于 Seed Evolving 大模型的智能人生规划系统 - 多 Agent 协作分析",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Life Planner Agent",
        "version": "1.0.0",
        "model": settings.SEED_MODEL,
    }


@app.get("/api")
async def api_root():
    """API root."""
    return {
        "message": "AI Life Planner Agent API",
        "endpoints": {
            "users": "/api/users",
            "plans": "/api/plans",
            "files": "/api/files",
            "daily_logs": "/api/logs",
        }
    }


# Try to serve frontend static files if they exist
import os
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=False,  # Disabled for Windows compatibility
    )
