from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import LeadStatus, MessageChannel, MessageDirection, PipelineStage, SolutionInterest
from app.schemas.ai import LeadAIAnalysis, LeadAIMessages, LeadAIState


class LeadActivityOut(BaseModel):
    id: int
    type: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadInteractionOut(BaseModel):
    id: int
    channel: MessageChannel
    direction: MessageDirection
    status: str
    subject: str
    content: str
    summary: str
    scheduled_for: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadBase(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str
    niche: str
    city: str
    owner_name: str = "Equipe comercial"
    interest_summary: str = ""
    company_size: str = "small"
    solution_interest: SolutionInterest
    website_status: str = "outdated"
    instagram_status: str = "inactive"
    monthly_budget: float = Field(ge=0)
    urgency_days: int = Field(ge=1)
    source: str = "manual"
    notes: str = ""
    pain_points: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    next_action: str = ""
    next_action_at: datetime | None = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    company_name: str | None = None
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    niche: str | None = None
    city: str | None = None
    owner_name: str | None = None
    interest_summary: str | None = None
    company_size: str | None = None
    solution_interest: SolutionInterest | None = None
    website_status: str | None = None
    instagram_status: str | None = None
    monthly_budget: float | None = Field(default=None, ge=0)
    urgency_days: int | None = Field(default=None, ge=1)
    source: str | None = None
    notes: str | None = None
    pain_points: list[str] | None = None
    tags: list[str] | None = None
    next_action: str | None = None
    next_action_at: datetime | None = None
    status: LeadStatus | None = None
    pipeline_stage: PipelineStage | None = None


class LeadOut(LeadBase):
    id: int
    score: int
    score_label: str
    temperature: str
    responsible: str
    interest: str
    diagnosis: str
    suggested_offer: str
    generated_message: str
    status: LeadStatus
    pipeline_stage: PipelineStage
    last_contact_at: datetime | None
    last_interaction_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    ai_analysis: LeadAIAnalysis | None = None
    ai_messages: LeadAIMessages | None = None
    ai_state: LeadAIState | None = None
    activities: list[LeadActivityOut] = Field(default_factory=list)
    interactions: list[LeadInteractionOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class LeadListParams(BaseModel):
    status: LeadStatus | None = None
    pipeline_stage: PipelineStage | None = None
    search: str | None = None
