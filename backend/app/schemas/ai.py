from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LeadAIScoreFactor(BaseModel):
    title: str
    impact: Literal["positive", "neutral", "negative"]
    detail: str


class LeadAIScore(BaseModel):
    value: int = Field(ge=0, le=100)
    label: Literal["cold", "warm", "hot"]
    explanation: str
    factors: list[LeadAIScoreFactor] = Field(default_factory=list)


class LeadAIRecommendedService(BaseModel):
    name: str
    rationale: str
    expected_outcome: str


class LeadAIAnalysis(BaseModel):
    summary: str
    diagnosis: str
    score: LeadAIScore
    recommended_service: LeadAIRecommendedService
    next_steps: list[str] = Field(default_factory=list)


class LeadAIMessages(BaseModel):
    whatsapp: str
    follow_up: str
    email_subject: str
    email_body: str
    call_script: str


class LeadAIState(BaseModel):
    analysis_source: Literal["gemini", "openai", "local"] | None = None
    messages_source: Literal["gemini", "openai", "local"] | None = None
    fallback_used: bool = False
    model: str | None = None
    last_error: str | None = None
    updated_at: datetime | None = None


class AIMessageRequest(BaseModel):
    custom_context: str | None = None


class AIFullAnalysisRequest(BaseModel):
    custom_context: str | None = None


class AIHealthOut(BaseModel):
    enabled: bool
    configured: bool
    available: bool
    provider: str
    mode: str
    model: str | None = None
    timeout_seconds: float
