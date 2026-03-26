from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.message_template import MessageTemplate
from app.schemas.lead import LeadInteractionOut
from app.schemas.messages import LeadInteractionIn, MessagePreviewIn, MessagePreviewOut, MessageTemplateIn, MessageTemplateOut
from app.services.lead_service import get_lead_by_id
from app.services.message_service import build_preview, create_interaction, create_template, delete_template, list_interactions, list_templates, update_template

router = APIRouter()


@router.get("/templates", response_model=list[MessageTemplateOut])
def get_templates(db: Session = Depends(get_db)) -> list[MessageTemplateOut]:
    return [MessageTemplateOut.model_validate(template) for template in list_templates(db)]


@router.post("/templates", response_model=MessageTemplateOut, status_code=status.HTTP_201_CREATED)
def post_template(payload: MessageTemplateIn, db: Session = Depends(get_db)) -> MessageTemplateOut:
    return MessageTemplateOut.model_validate(create_template(db, payload))


@router.put("/templates/{template_id}", response_model=MessageTemplateOut)
def put_template(template_id: int, payload: MessageTemplateIn, db: Session = Depends(get_db)) -> MessageTemplateOut:
    template = db.get(MessageTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template nao encontrado")
    return MessageTemplateOut.model_validate(update_template(db, template, payload))


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_template(template_id: int, db: Session = Depends(get_db)) -> None:
    template = db.get(MessageTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template nao encontrado")
    delete_template(db, template)


@router.post("/preview", response_model=MessagePreviewOut)
def post_preview(payload: MessagePreviewIn, db: Session = Depends(get_db)) -> MessagePreviewOut:
    try:
        return build_preview(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/leads/{lead_id}/history", response_model=list[LeadInteractionOut])
def get_lead_history(lead_id: int, db: Session = Depends(get_db)) -> list[LeadInteractionOut]:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return [LeadInteractionOut.model_validate(item) for item in list_interactions(db, lead_id)]


@router.post("/leads/{lead_id}/history", response_model=LeadInteractionOut, status_code=status.HTTP_201_CREATED)
def post_lead_history(lead_id: int, payload: LeadInteractionIn, db: Session = Depends(get_db)) -> LeadInteractionOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return LeadInteractionOut.model_validate(create_interaction(db, lead, payload))
