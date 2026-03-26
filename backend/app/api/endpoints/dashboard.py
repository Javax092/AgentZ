from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.dashboard import DashboardOut
from app.services.dashboard_service import build_dashboard_metrics

router = APIRouter()


@router.get("", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db)) -> DashboardOut:
    return DashboardOut.model_validate(build_dashboard_metrics(db))
