from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MessageChannel
from app.models.lead import Lead, LeadInteraction
from app.models.message_template import MessageTemplate
from app.schemas.messages import LeadInteractionIn, MessagePreviewIn, MessagePreviewOut, MessageTemplateIn
from app.services.approach_service import generate_approach_message
from app.services.lead_service import get_lead_by_id
from app.services.settings_service import get_or_create_settings


def list_templates(db: Session) -> list[MessageTemplate]:
    return list(db.scalars(select(MessageTemplate).order_by(MessageTemplate.updated_at.desc())).all())


def create_template(db: Session, payload: MessageTemplateIn) -> MessageTemplate:
    template = MessageTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(db: Session, template: MessageTemplate, payload: MessageTemplateIn) -> MessageTemplate:
    for key, value in payload.model_dump().items():
        setattr(template, key, value)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template: MessageTemplate) -> None:
    db.delete(template)
    db.commit()


def build_preview(db: Session, payload: MessagePreviewIn) -> MessagePreviewOut:
    lead = get_lead_by_id(db, payload.lead_id)
    if lead is None:
        raise ValueError("Lead nao encontrado")

    settings = get_or_create_settings(db)
    template = db.get(MessageTemplate, payload.template_id) if payload.template_id else None
    channel = template.channel if template else MessageChannel.whatsapp
    content = template.content if template else generate_approach_message(settings, lead, payload.custom_context)
    content = (
        content.replace("{{lead_name}}", lead.contact_name)
        .replace("{{company_name}}", lead.company_name)
        .replace("{{city}}", lead.city)
    )
    return MessagePreviewOut(channel=channel, subject=template.goal if template else None, content=content, source="template" if template else "ai")


def create_interaction(db: Session, lead: Lead, payload: LeadInteractionIn) -> LeadInteraction:
    interaction = LeadInteraction(**payload.model_dump(), lead_id=lead.id)
    if payload.status == "sent":
        interaction.sent_at = datetime.utcnow()
        lead.last_contact_at = interaction.sent_at
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def list_interactions(db: Session, lead_id: int) -> list[LeadInteraction]:
    return list(
        db.scalars(select(LeadInteraction).where(LeadInteraction.lead_id == lead_id).order_by(LeadInteraction.created_at.desc())).all()
    )
