"""API Routes."""
from fastapi import APIRouter
from .users import router as users_router
from .plans import router as plans_router
from .files import router as files_router
from .logs import router as logs_router

api_router = APIRouter(prefix="/api")

api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(plans_router, prefix="/plans", tags=["plans"])
api_router.include_router(files_router, prefix="/files", tags=["files"])
api_router.include_router(logs_router, prefix="/logs", tags=["daily-logs"])
