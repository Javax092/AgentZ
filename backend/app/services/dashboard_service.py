from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import LeadStatus
from app.models.lead import LeadActivity
from app.schemas.lead import LeadListParams
from app.services.lead_service import list_leads


def _enum_value(value):
    return getattr(value, "value", value)


def build_dashboard_metrics(db: Session) -> dict:
    leads = list_leads(db, LeadListParams())
    total = len(leads)
    qualified = len([lead for lead in leads if lead.score >= 60])
    hot_leads = len([lead for lead in leads if lead.temperature == "hot"])
    no_response_deadline = datetime.utcnow() - timedelta(hours=72)
    leads_without_response = len([lead for lead in leads if not lead.last_contact_at or lead.last_contact_at <= no_response_deadline])
    avg_score = round(sum(lead.score for lead in leads) / total, 1) if total else 0
    won = len([lead for lead in leads if lead.status == LeadStatus.won])
    conversion_rate = round((won / total) * 100, 1) if total else 0
    pending_tasks = len([lead for lead in leads if lead.next_action and (lead.next_action_at is None or lead.next_action_at <= datetime.utcnow())])

    pipeline_order = ["novo", "contato_iniciado", "qualificado", "proposta", "fechado", "perdido"]
    pipeline_counts = Counter(_enum_value(lead.pipeline_stage) for lead in leads)
    niche_counts = Counter(lead.niche for lead in leads)
    city_counts = Counter(lead.city for lead in leads)
    recent_activities = list(db.scalars(select(LeadActivity).order_by(LeadActivity.created_at.desc()).limit(8)).all())

    return {
        "total_leads": total,
        "qualified_leads": qualified,
        "hot_leads": hot_leads,
        "leads_without_response": leads_without_response,
        "avg_score": avg_score,
        "conversion_rate": conversion_rate,
        "pending_tasks": pending_tasks,
        "pipeline": [{"stage": stage, "count": pipeline_counts.get(stage, 0)} for stage in pipeline_order],
        "top_niches": [{"name": name, "count": count} for name, count in niche_counts.most_common(5)],
        "cities": [{"name": name, "count": count} for name, count in city_counts.most_common(5)],
        "recent_activities": [
            {
                "id": activity.id,
                "type": activity.type,
                "description": activity.description,
                "lead_id": activity.lead_id,
                "lead_name": next((lead.company_name for lead in leads if lead.id == activity.lead_id), None),
                "created_at": activity.created_at.isoformat(),
            }
            for activity in recent_activities
        ],
    }
