from typing import Any

from pydantic import BaseModel, ConfigDict


class SettingsIn(BaseModel):
    company_name: str
    positioning: str
    target_niches: list[str]
    target_cities: list[str]
    qualification_rules: dict[str, Any]
    prompt_tone: str


class SettingsOut(SettingsIn):
    id: int

    model_config = ConfigDict(from_attributes=True)
