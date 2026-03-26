from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.approach import MessageRequest, MessageResponse
from app.services.approach_service import generate_approach_message
from app.services.lead_service import get_lead_by_id
from app.services.settings_service import get_or_create_settings

router = APIRouter()


@router.post("/generate", response_model=MessageResponse)
def generate_approach(payload: MessageRequest, db: Session = Depends(get_db)) -> MessageResponse:
    settings_model = get_or_create_settings(db)
    lead = None
    if payload.lead_id is not None:
        lead = get_lead_by_id(db, payload.lead_id)
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return MessageResponse(message=generate_approach_message(settings_model, lead, payload.custom_context))
