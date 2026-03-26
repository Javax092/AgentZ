from app.models.agent_settings import AgentSettings
from app.models.lead import Lead


def generate_approach_message(settings: AgentSettings, lead: Lead | None, custom_context: str | None = None) -> str:
    if lead is None:
        base = (
            f"Tom {settings.prompt_tone}. Contextualize o cenario do lead, evidencie o gargalo comercial "
            f"e conecte a oferta com {settings.positioning.lower()}."
        )
        return f"{base} Contexto adicional: {custom_context}" if custom_context else base

    pains = ", ".join(lead.pain_points[:2]) or "mais previsibilidade comercial"
    message = (
        f"Oi, {lead.contact_name}. Analisei a presença da {lead.company_name} em {lead.city} e vi espaço para melhorar "
        f"{pains}. Trabalho com {settings.positioning.lower()} e acredito que uma solução de "
        f"{lead.solution_interest.value.replace('_', ' ')} pode destravar mais velocidade comercial para o seu time."
    )
    if custom_context:
        message = f"{message} Contexto adicional considerado: {custom_context}."
    return f"{message} Se fizer sentido, eu posso te mostrar um diagnóstico inicial ainda esta semana."
