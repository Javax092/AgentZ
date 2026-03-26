from app.models.lead import Lead


def generate_diagnosis(lead: Lead) -> str:
    primary_pain = ", ".join(lead.pain_points[:3]) or "presenca digital e operacao comercial"
    return (
        f"{lead.company_name} apresenta oportunidade em {primary_pain}. "
        f"Hoje o lead opera com site {lead.website_status}, Instagram {lead.instagram_status}, "
        f"orcamento estimado em R$ {lead.monthly_budget:,.2f} e urgencia de {lead.urgency_days} dias."
    )


def suggest_offer(lead: Lead) -> str:
    match lead.solution_interest.value:
        case "automation":
            return "Automacao comercial com captacao, triagem e follow-up integrado."
        case "landing_page":
            return "Landing page de alta conversao com tracking, copy e formularios."
        case "web_system":
            return "Sistema web sob medida para centralizar atendimento, operacao e dados."
        case _:
            return "Pacote combinado com automacao, landing page e painel operacional."
