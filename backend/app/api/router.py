from fastapi import APIRouter, Depends

from app.api.deps import require_authenticated_user
from app.api.endpoints import ai, approaches, auth, crm, dashboard, health, leads, settings

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_authenticated_user)])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"], dependencies=[Depends(require_authenticated_user)])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"], dependencies=[Depends(require_authenticated_user)])
api_router.include_router(approaches.router, prefix="/approaches", tags=["approaches"], dependencies=[Depends(require_authenticated_user)])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"], dependencies=[Depends(require_authenticated_user)])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"], dependencies=[Depends(require_authenticated_user)])
