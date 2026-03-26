from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SettingsIn(BaseModel):
    company_name: str
    description: str
    niche: str
    city: str
    service_type: str
    ai_tone: str
    primary_goal: str
    initial_message: str
    follow_up_message: str
    follow_up_delay_hours: int = Field(ge=1, le=720)
    max_follow_up_attempts: int = Field(ge=1, le=20)
    hot_lead_score_threshold: int = Field(ge=0, le=100)
    webhook_url: str = ""
    provider_name: str = "gemini"
    provider_api_key: str | None = None
    positioning: str
    target_niches: list[str]
    target_cities: list[str]
    qualification_rules: dict[str, Any]
    prompt_tone: str


class SettingsOut(BaseModel):
    id: int
    company_name: str
    description: str
    niche: str
    city: str
    service_type: str
    ai_tone: str
    primary_goal: str
    initial_message: str
    follow_up_message: str
    follow_up_delay_hours: int
    max_follow_up_attempts: int
    hot_lead_score_threshold: int
    webhook_url: str
    provider_name: str
    has_provider_api_key: bool
    positioning: str
    target_niches: list[str]
    target_cities: list[str]
    qualification_rules: dict[str, Any]
    prompt_tone: str

    model_config = ConfigDict(from_attributes=True)
