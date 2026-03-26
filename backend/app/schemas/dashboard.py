from typing import Any

from pydantic import BaseModel


class DashboardActivityOut(BaseModel):
    id: int
    type: str
    description: str
    lead_id: int | None = None
    lead_name: str | None = None
    created_at: str


class DashboardOut(BaseModel):
    total_leads: int
    qualified_leads: int
    hot_leads: int
    leads_without_response: int
    avg_score: float
    conversion_rate: float
    pending_tasks: int
    pipeline: list[dict[str, Any]]
    top_niches: list[dict[str, Any]]
    cities: list[dict[str, Any]]
    recent_activities: list[DashboardActivityOut]
