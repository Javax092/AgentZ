from datetime import datetime

from pydantic import BaseModel

from app.models.enums import LeadStatus, PipelineStage


class PipelineMoveIn(BaseModel):
    pipeline_stage: PipelineStage
    status: LeadStatus | None = None


class LeadActivityCreate(BaseModel):
    type: str
    description: str


class CRMBoardLeadOut(BaseModel):
    id: int
    company_name: str
    contact_name: str
    score: int
    score_label: str
    status: str
    next_action: str
    owner_name: str


class CRMColumnOut(BaseModel):
    stage: PipelineStage
    label: str
    count: int
    leads: list[CRMBoardLeadOut]


class CRMBoardOut(BaseModel):
    updated_at: datetime
    columns: list[CRMColumnOut]
