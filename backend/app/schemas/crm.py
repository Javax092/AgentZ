from datetime import datetime

from pydantic import BaseModel

from app.models.enums import LeadStatus, PipelineStage


class PipelineMoveIn(BaseModel):
    pipeline_stage: PipelineStage
    status: LeadStatus | None = None


class LeadActivityCreate(BaseModel):
    type: str
    description: str


class CRMColumnOut(BaseModel):
    stage: PipelineStage
    count: int
    leads: list[dict]


class CRMBoardOut(BaseModel):
    updated_at: datetime
    columns: list[CRMColumnOut]
