from collections import Counter

from sqlalchemy.orm import Session

from app.models.enums import LeadStatus
from app.schemas.lead import LeadListParams
from app.services.lead_service import list_leads


def _enum_value(value):
    return getattr(value, "value", value)


def build_dashboard_metrics(db: Session) -> dict:
    leads = list_leads(db, LeadListParams())
    total = len(leads)
    qualified = len([lead for lead in leads if lead.score >= 60])
    avg_score = round(sum(lead.score for lead in leads) / total, 1) if total else 0
    won = len([lead for lead in leads if lead.status == LeadStatus.won])
    conversion_rate = round((won / total) * 100, 1) if total else 0

    pipeline_order = ["entrada", "diagnostico", "proposta", "negociacao", "fechado"]
    pipeline_counts = Counter(_enum_value(lead.pipeline_stage) for lead in leads)
    niche_counts = Counter(lead.niche for lead in leads)
    city_counts = Counter(lead.city for lead in leads)

    return {
        "total_leads": total,
        "qualified_leads": qualified,
        "avg_score": avg_score,
        "conversion_rate": conversion_rate,
        "pipeline": [{"stage": stage, "count": pipeline_counts.get(stage, 0)} for stage in pipeline_order],
        "top_niches": [{"name": name, "count": count} for name, count in niche_counts.most_common(5)],
        "cities": [{"name": name, "count": count} for name, count in city_counts.most_common(5)],
    }
