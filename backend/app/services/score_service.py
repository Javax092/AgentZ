from app.models.agent_settings import AgentSettings
from app.models.lead import Lead


def classify_score(score: int, settings: AgentSettings | None = None) -> str:
    hot_threshold = settings.hot_lead_score_threshold if settings else 80
    warm_threshold = max(40, hot_threshold - 20)

    if score >= hot_threshold:
        return "hot"
    if score >= warm_threshold:
        return "warm"
    return "cold"


def calculate_score(lead: Lead, settings: AgentSettings) -> int:
    rules = settings.qualification_rules or {}
    budget_rules = rules.get("budget_weights", {})
    urgency_rules = rules.get("urgency_weights", {})
    score = 0

    if lead.monthly_budget >= 5000:
        score += budget_rules.get("high", 30)
    elif lead.monthly_budget >= 2000:
        score += budget_rules.get("medium", 20)
    else:
        score += budget_rules.get("low", 10)

    if lead.urgency_days <= 7:
        score += urgency_rules.get("urgent", 25)
    elif lead.urgency_days <= 21:
        score += urgency_rules.get("medium", 15)
    else:
        score += urgency_rules.get("low", 5)

    if lead.niche in settings.target_niches:
        score += 15
    if lead.city in settings.target_cities:
        score += 10
    if lead.website_status in {"none", "outdated"}:
        score += 8
    if lead.instagram_status in {"inactive", "weak"}:
        score += 6
    if lead.solution_interest.value == "mixed":
        score += 12
    if len(lead.pain_points) >= 2:
        score += 8

    return min(score, 100)
