from typing import Any

from pydantic import BaseModel


class DashboardOut(BaseModel):
    total_leads: int
    qualified_leads: int
    avg_score: float
    conversion_rate: float
    pipeline: list[dict[str, Any]]
    top_niches: list[dict[str, Any]]
    cities: list[dict[str, Any]]
