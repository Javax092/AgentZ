from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MessageChannel, MessageDirection


class MessageTemplateIn(BaseModel):
    name: str
    channel: MessageChannel
    goal: str
    content: str = Field(min_length=10)
    is_active: bool = True


class MessageTemplateOut(MessageTemplateIn):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessagePreviewIn(BaseModel):
    lead_id: int
    template_id: int | None = None
    custom_context: str | None = None


class MessagePreviewOut(BaseModel):
    channel: MessageChannel
    subject: str | None = None
    content: str
    source: str


class LeadInteractionIn(BaseModel):
    channel: MessageChannel
    direction: MessageDirection = MessageDirection.outbound
    status: str = "draft"
    subject: str = ""
    content: str
    summary: str = ""
    scheduled_for: datetime | None = None


class LeadInteractionOut(LeadInteractionIn):
    id: int
    sent_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
