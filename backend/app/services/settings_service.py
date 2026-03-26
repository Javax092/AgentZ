from sqlalchemy.orm import Session

from app.models.agent_settings import AgentSettings
from app.models.lead import Lead
from app.schemas.settings import SettingsIn
from app.services.approach_service import generate_approach_message
from app.services.diagnosis_service import generate_diagnosis, suggest_offer
from app.services.score_service import calculate_score, classify_score

DEFAULT_SETTINGS = {
    "company_name": "LeadFlow Manaus",
    "positioning": "Operacao consultiva para captacao, qualificacao e CRM comercial de negocios locais em Manaus.",
    "target_niches": ["Barbearia", "Clinicas", "Imobiliarias", "Loja de moveis", "Salao de beleza"],
    "target_cities": ["Manaus"],
    "qualification_rules": {
        "budget_weights": {"high": 30, "medium": 20, "low": 10},
        "urgency_weights": {"urgent": 25, "medium": 15, "low": 5},
    },
    "prompt_tone": "consultivo",
}


def get_or_create_settings(db: Session) -> AgentSettings:
    settings = db.get(AgentSettings, 1)
    if settings:
        return settings

    settings = AgentSettings(id=1, **DEFAULT_SETTINGS)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_settings(db: Session, payload: SettingsIn) -> AgentSettings:
    settings = get_or_create_settings(db)
    for key, value in payload.model_dump().items():
        setattr(settings, key, value)

    leads = db.query(Lead).all()
    for lead in leads:
        lead.score = calculate_score(lead, settings)
        lead.score_label = classify_score(lead.score)
        lead.diagnosis = generate_diagnosis(lead)
        lead.suggested_offer = suggest_offer(lead)
        lead.generated_message = generate_approach_message(settings, lead)

    db.commit()
    db.refresh(settings)
    return settings
