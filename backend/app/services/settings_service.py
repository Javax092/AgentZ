from sqlalchemy.orm import Session

from app.models.agent_settings import AgentSettings
from app.models.lead import Lead
from app.schemas.settings import SettingsIn, SettingsOut
from app.services.approach_service import generate_approach_message
from app.services.diagnosis_service import generate_diagnosis, suggest_offer
from app.services.score_service import calculate_score, classify_score

DEFAULT_SETTINGS = {
    "company_name": "LeadFlow AI",
    "description": "CRM com IA para captar, qualificar e converter leads de pequenos negocios.",
    "niche": "Pequenos negocios",
    "city": "Manaus",
    "service_type": "WhatsApp, Instagram e comercial consultivo",
    "ai_tone": "consultivo",
    "primary_goal": "Converter mais leads em propostas e reunioes",
    "initial_message": "Oi, {{lead_name}}. Notei potencial de ganho comercial na {{company_name}} e tenho uma sugestao pratica para aumentar a conversao.",
    "follow_up_message": "Retomando nosso contato porque ainda vejo oportunidade clara de acelerar seu atendimento comercial.",
    "follow_up_delay_hours": 24,
    "max_follow_up_attempts": 4,
    "hot_lead_score_threshold": 80,
    "webhook_url": "",
    "provider_name": "gemini",
    "positioning": "Operacao consultiva para captacao, qualificacao e CRM comercial de negocios locais em Manaus.",
    "target_niches": ["Barbearia", "Clinicas", "Imobiliarias", "Loja de moveis", "Salao de beleza"],
    "target_cities": ["Manaus"],
    "qualification_rules": {
        "budget_weights": {"high": 30, "medium": 20, "low": 10},
        "urgency_weights": {"urgent": 25, "medium": 15, "low": 5},
    },
    "prompt_tone": "consultivo",
}


def serialize_settings(settings: AgentSettings) -> SettingsOut:
    return SettingsOut.model_validate(
        {
            "id": settings.id,
            "company_name": settings.company_name,
            "description": settings.description,
            "niche": settings.niche,
            "city": settings.city,
            "service_type": settings.service_type,
            "ai_tone": settings.ai_tone,
            "primary_goal": settings.primary_goal,
            "initial_message": settings.initial_message,
            "follow_up_message": settings.follow_up_message,
            "follow_up_delay_hours": settings.follow_up_delay_hours,
            "max_follow_up_attempts": settings.max_follow_up_attempts,
            "hot_lead_score_threshold": settings.hot_lead_score_threshold,
            "webhook_url": settings.webhook_url,
            "provider_name": settings.provider_name,
            "has_provider_api_key": bool(settings.gemini_enabled and settings.gemini_api_key),
            "positioning": settings.positioning,
            "target_niches": settings.target_niches,
            "target_cities": settings.target_cities,
            "qualification_rules": settings.qualification_rules,
            "prompt_tone": settings.prompt_tone,
        }
    )


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
    values = payload.model_dump(exclude_none=True)
    for key, value in values.items():
        setattr(settings, key, value)

    leads = db.query(Lead).all()
    for lead in leads:
        lead.score = calculate_score(lead, settings)
        lead.score_label = classify_score(lead.score, settings)
        lead.diagnosis = generate_diagnosis(lead)
        lead.suggested_offer = suggest_offer(lead)
        lead.generated_message = generate_approach_message(settings, lead)

    db.commit()
    db.refresh(settings)
    return settings
