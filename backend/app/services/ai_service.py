import json
from datetime import datetime
from typing import Literal

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.gemini_client import get_gemini_model, get_gemini_status
from app.models.enums import LeadStatus
from app.models.lead import Lead, LeadActivity
from app.schemas.ai import (
    AINextActionOut,
    AIHealthOut,
    AISuggestResponseOut,
    AISummaryOut,
    LeadAIAnalysis,
    LeadAIMessages,
    LeadAIRecommendedService,
    LeadAIScore,
    LeadAIScoreFactor,
    LeadAIState,
)
from app.services.approach_service import generate_approach_message
from app.services.diagnosis_service import generate_diagnosis, suggest_offer
from app.services.lead_service import get_lead_by_id
from app.services.score_service import calculate_score, classify_score
from app.services.settings_service import get_or_create_settings

Provider = Literal["gemini", "local"]


def _lead_payload(lead: Lead) -> dict[str, object]:
    return {
        "company_name": lead.company_name,
        "contact_name": lead.contact_name,
        "email": lead.email,
        "phone": lead.phone,
        "niche": lead.niche,
        "city": lead.city,
        "owner_name": lead.owner_name,
        "interest_summary": lead.interest_summary,
        "company_size": lead.company_size,
        "solution_interest": lead.solution_interest.value,
        "website_status": lead.website_status,
        "instagram_status": lead.instagram_status,
        "monthly_budget": lead.monthly_budget,
        "urgency_days": lead.urgency_days,
        "source": lead.source,
        "notes": lead.notes,
        "next_action": lead.next_action,
        "pain_points": lead.pain_points,
        "tags": lead.tags,
        "pipeline_stage": lead.pipeline_stage.value,
        "status": lead.status.value,
    }


def _local_analysis(lead: Lead, db: Session) -> LeadAIAnalysis:
    settings_model = get_or_create_settings(db)
    score = calculate_score(lead, settings_model)
    score_label = classify_score(score, settings_model)
    return LeadAIAnalysis(
        summary=(
            f"{lead.company_name} tem aderencia comercial {score_label} para a operacao atual, "
            f"com maior peso em urgencia, aderencia de nicho/cidade e maturidade digital."
        ),
        diagnosis=generate_diagnosis(lead),
        score=LeadAIScore(
            value=score,
            label=score_label,
            explanation=(
                f"Score {score} calculado por orcamento, urgencia, aderencia ao ICP, "
                f"maturidade digital e volume de dores mapeadas."
            ),
            factors=[
                LeadAIScoreFactor(
                    title="Orcamento mensal",
                    impact="positive" if lead.monthly_budget >= 2000 else "neutral",
                    detail=f"Capacidade estimada de investimento em R$ {lead.monthly_budget:,.2f}.",
                ),
                LeadAIScoreFactor(
                    title="Urgencia",
                    impact="positive" if lead.urgency_days <= 21 else "neutral",
                    detail=f"Janela de decisao declarada em {lead.urgency_days} dias.",
                ),
                LeadAIScoreFactor(
                    title="Presenca digital",
                    impact="negative" if lead.website_status in {"none", "outdated"} else "neutral",
                    detail=f"Site {lead.website_status} e Instagram {lead.instagram_status}.",
                ),
            ],
        ),
        recommended_service=LeadAIRecommendedService(
            name=suggest_offer(lead),
            rationale=(
                f"A recomendacao prioriza o interesse em {lead.solution_interest.value.replace('_', ' ')} "
                f"e os gargalos descritos pelo lead."
            ),
            expected_outcome="Aumentar captacao, velocidade comercial e consistencia do follow-up.",
        ),
        next_steps=[
            "Validar quem decide a compra e o prazo real do projeto.",
            "Priorizar um diagnostico de funil e atendimento.",
            "Apresentar um piloto enxuto com meta comercial clara.",
        ],
    )


def _local_messages(lead: Lead, db: Session, custom_context: str | None = None) -> LeadAIMessages:
    settings_model = get_or_create_settings(db)
    base_message = generate_approach_message(settings_model, lead, custom_context)
    return LeadAIMessages(
        whatsapp=base_message,
        follow_up=(
            f"Oi, {lead.contact_name}. {settings_model.follow_up_message} "
            f"Na {lead.company_name}, vejo um ganho claro com um ajuste simples no processo comercial. Posso te mandar um esboco objetivo?"
        ),
        email_subject=f"Ideia pratica para destravar o comercial da {lead.company_name}",
        email_body=(
            f"Ola, {lead.contact_name}.\n\n"
            f"Analisei o contexto da {lead.company_name} e identifiquei espaco para melhorar "
            f"{', '.join(lead.pain_points[:2]) or 'a previsibilidade comercial'}. "
            f"Minha sugestao inicial seria atacar isso com {suggest_offer(lead).lower()}.\n\n"
            "Se fizer sentido, posso te enviar um diagnostico inicial em poucas linhas."
        ),
        call_script=(
            f"Abertura: mencionar {lead.company_name} e o contexto em {lead.city}. "
            f"Explorar as dores {', '.join(lead.pain_points[:2]) or 'comerciais'} e fechar com convite para diagnostico."
        ),
    )


def _generate_gemini_json(
    *,
    schema_model: type[LeadAIAnalysis] | type[LeadAIMessages],
    system_instruction: str,
    payload: dict[str, object],
    temperature: float,
) -> LeadAIAnalysis | LeadAIMessages:
    model = get_gemini_model()
    if model is None:
        raise RuntimeError("Gemini indisponivel")

    prompt = (
        f"{system_instruction}\n"
        "Responda apenas JSON valido, sem markdown, seguindo exatamente o schema informado.\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            response_mime_type="application/json",
        ),
        request_options={"timeout": settings.gemini_timeout_seconds},
    )
    raw_text = getattr(response, "text", "") or ""
    if not raw_text.strip():
        raise RuntimeError("Resposta estruturada ausente")
    return schema_model.model_validate_json(raw_text)


def _gemini_analysis(lead: Lead, db: Session) -> LeadAIAnalysis:
    if get_gemini_model() is None:
        raise RuntimeError("Gemini indisponivel")

    settings_model = get_or_create_settings(db)
    parsed = _generate_gemini_json(
        schema_model=LeadAIAnalysis,
        system_instruction=(
            "Voce analisa leads B2B/B2SMB para uma operacao comercial consultiva no Brasil. "
            "Seja concreto, comercial e evite generalidades."
        ),
        payload={
            "lead": _lead_payload(lead),
            "agent_settings": {
                "company_name": settings_model.company_name,
                "positioning": settings_model.positioning,
                "target_niches": settings_model.target_niches,
                "target_cities": settings_model.target_cities,
                "prompt_tone": settings_model.prompt_tone,
            },
            "task": (
                "Gerar diagnostico do lead, score explicado, recomendacao objetiva de servico "
                "e proximos passos comerciais."
            ),
            "response_schema": LeadAIAnalysis.model_json_schema(),
        },
        temperature=0.2,
    )
    parsed.score.value = max(0, min(100, parsed.score.value))
    parsed.score.label = classify_score(parsed.score.value, settings_model)
    return parsed


def _gemini_messages(lead: Lead, db: Session, custom_context: str | None = None) -> LeadAIMessages:
    if get_gemini_model() is None:
        raise RuntimeError("Gemini indisponivel")

    settings_model = get_or_create_settings(db)
    parsed = _generate_gemini_json(
        schema_model=LeadAIMessages,
        system_instruction=(
            "Voce escreve mensagens comerciais consultivas em portugues do Brasil para prospeccao e follow-up. "
            "Mantenha tom humano, objetivo e orientado a negocio."
        ),
        payload={
            "lead": _lead_payload(lead),
            "positioning": settings_model.positioning,
            "prompt_tone": settings_model.prompt_tone,
            "custom_context": custom_context,
            "task": "Gerar mensagens comerciais para WhatsApp, follow-up, email e um roteiro curto de ligacao.",
            "response_schema": LeadAIMessages.model_json_schema(),
        },
        temperature=0.4,
    )
    return parsed


def _persist_state(
    db: Session,
    lead: Lead,
    *,
    analysis: LeadAIAnalysis | None = None,
    messages: LeadAIMessages | None = None,
    analysis_source: Provider | None = None,
    messages_source: Provider | None = None,
    fallback_used: bool = False,
    last_error: str | None = None,
) -> None:
    if analysis is not None:
        lead.ai_analysis = analysis.model_dump(mode="json")
        lead.diagnosis = analysis.diagnosis
        lead.suggested_offer = analysis.recommended_service.name
        lead.score = analysis.score.value
        lead.score_label = classify_score(analysis.score.value, get_or_create_settings(db))
        if lead.score >= 60 and lead.status == LeadStatus.new:
            lead.status = LeadStatus.qualified
        lead.next_action = analysis.next_steps[0] if analysis.next_steps else lead.next_action

    if messages is not None:
        lead.ai_messages = messages.model_dump(mode="json")
        lead.generated_message = messages.whatsapp

    previous_state = dict(lead.ai_state or {})
    state = LeadAIState(
        analysis_source=analysis_source or previous_state.get("analysis_source"),
        messages_source=messages_source or previous_state.get("messages_source"),
        fallback_used=fallback_used,
        model=settings.gemini_model if settings.gemini_enabled and settings.gemini_api_key else None,
        last_error=last_error,
        updated_at=datetime.utcnow(),
    )
    lead.ai_state = state.model_dump(mode="json")


def _commit_and_reload(db: Session, lead: Lead, activity_type: str, description: str) -> Lead:
    db.add(LeadActivity(lead_id=lead.id, type=activity_type, description=description))
    db.commit()
    return get_lead_by_id(db, lead.id) or lead


def analyze_lead(db: Session, lead: Lead) -> Lead:
    source: Provider = "local"
    fallback_used = False
    last_error: str | None = None
    try:
        analysis = _gemini_analysis(lead, db)
        source = "gemini"
    except Exception as exc:
        analysis = _local_analysis(lead, db)
        fallback_used = get_gemini_model() is not None or get_gemini_status()["enabled"]
        last_error = str(exc) if fallback_used else None

    _persist_state(
        db,
        lead,
        analysis=analysis,
        analysis_source=source,
        fallback_used=fallback_used,
        last_error=last_error,
    )
    return _commit_and_reload(db, lead, "ai_analysis", f"Analise de IA gerada via {source}.")


def generate_lead_messages(db: Session, lead: Lead, custom_context: str | None = None) -> Lead:
    source: Provider = "local"
    fallback_used = False
    last_error: str | None = None
    try:
        messages = _gemini_messages(lead, db, custom_context)
        source = "gemini"
    except Exception as exc:
        messages = _local_messages(lead, db, custom_context)
        fallback_used = get_gemini_model() is not None or get_gemini_status()["enabled"]
        last_error = str(exc) if fallback_used else None

    _persist_state(
        db,
        lead,
        messages=messages,
        messages_source=source,
        fallback_used=fallback_used,
        last_error=last_error,
    )
    return _commit_and_reload(db, lead, "ai_messages", f"Mensagens comerciais geradas via {source}.")


def generate_full_analysis(db: Session, lead: Lead, custom_context: str | None = None) -> Lead:
    analysis_source: Provider = "local"
    messages_source: Provider = "local"
    fallback_used = False
    errors: list[str] = []

    try:
        analysis = _gemini_analysis(lead, db)
        analysis_source = "gemini"
    except Exception as exc:
        analysis = _local_analysis(lead, db)
        fallback_used = fallback_used or bool(get_gemini_status()["enabled"])
        errors.append(str(exc))

    try:
        messages = _gemini_messages(lead, db, custom_context)
        messages_source = "gemini"
    except Exception as exc:
        messages = _local_messages(lead, db, custom_context)
        fallback_used = fallback_used or bool(get_gemini_status()["enabled"])
        errors.append(str(exc))

    _persist_state(
        db,
        lead,
        analysis=analysis,
        messages=messages,
        analysis_source=analysis_source,
        messages_source=messages_source,
        fallback_used=fallback_used,
        last_error=" | ".join(errors) if errors else None,
    )
    return _commit_and_reload(
        db,
        lead,
        "ai_full_analysis",
        f"Analise completa de IA gerada. Analise via {analysis_source}; mensagens via {messages_source}.",
    )


def ai_health() -> AIHealthOut:
    return AIHealthOut.model_validate(get_gemini_status())


def suggest_response(db: Session, lead: Lead, channel: str = "whatsapp") -> AISuggestResponseOut:
    messages = _local_messages(lead, db)
    message = messages.whatsapp if channel == "whatsapp" else messages.email_body if channel == "email" else messages.call_script
    return AISuggestResponseOut(
        channel=channel,  # type: ignore[arg-type]
        message=message,
        rationale="Resposta sugerida considerando configuracoes do negocio, score atual e dores do lead.",
    )


def summarize_lead(db: Session, lead: Lead) -> AISummaryOut:
    analysis = lead.ai_analysis or _local_analysis(lead, db).model_dump(mode="json")
    return AISummaryOut(
        summary=str(analysis.get("summary") or lead.diagnosis),
        score=lead.score,
        temperature=lead.score_label,  # type: ignore[arg-type]
        next_action=lead.next_action or "Realizar follow-up consultivo",
    )


def recommend_next_action(db: Session, lead: Lead) -> AINextActionOut:
    settings_model = get_or_create_settings(db)
    urgency = "high" if lead.score_label == "hot" else "medium" if lead.score_label == "warm" else "low"
    action = lead.next_action or f"Executar follow-up em ate {settings_model.follow_up_delay_hours} horas."
    return AINextActionOut(
        recommended_action=action,
        why_now=f"O lead esta em {lead.pipeline_stage.value} com temperatura {lead.score_label} e objetivo principal '{settings_model.primary_goal}'.",
        urgency=urgency,  # type: ignore[arg-type]
    )
