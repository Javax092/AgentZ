from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.settings import SettingsIn, SettingsOut
from app.services.settings_service import get_or_create_settings, update_settings

router = APIRouter()


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)) -> SettingsOut:
    return get_or_create_settings(db)


@router.put("", response_model=SettingsOut)
def put_settings(payload: SettingsIn, db: Session = Depends(get_db)) -> SettingsOut:
    return update_settings(db, payload)
