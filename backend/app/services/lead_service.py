from datetime import datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import LeadStatus, PipelineStage
from app.models.lead import Lead, LeadActivity, LeadInteraction
from app.schemas.lead import LeadCreate, LeadListParams, LeadOut, LeadUpdate
from app.services.approach_service import generate_approach_message
from app.services.diagnosis_service import generate_diagnosis, suggest_offer
from app.services.score_service import calculate_score, classify_score
from app.services.settings_service import get_or_create_settings


def _hydrate_lead(lead: Lead, db: Session) -> Lead:
    db.flush()
    db.refresh(lead)
    return get_lead_by_id(db, lead.id)


def _apply_business_rules(lead: Lead, db: Session) -> Lead:
    settings = get_or_create_settings(db)
    lead.score = calculate_score(lead, settings)
    lead.score_label = classify_score(lead.score, settings)
    lead.diagnosis = generate_diagnosis(lead)
    lead.suggested_offer = suggest_offer(lead)
    lead.generated_message = generate_approach_message(settings, lead)
    if not lead.owner_name:
        lead.owner_name = "Equipe comercial"
    if not lead.interest_summary:
        lead.interest_summary = lead.solution_interest.value.replace("_", " ")
    if not lead.next_action:
        lead.next_action = "Realizar primeiro contato consultivo"
    if lead.next_action_at is None:
        lead.next_action_at = datetime.utcnow() + timedelta(hours=settings.follow_up_delay_hours)
    if lead.score >= 60 and lead.status == LeadStatus.new:
        lead.status = LeadStatus.qualified
    if not lead.pipeline_stage:
        lead.pipeline_stage = PipelineStage.new
    if lead.pipeline_stage == PipelineStage.contact_started and lead.status == LeadStatus.new:
        lead.status = LeadStatus.contacted
    if lead.pipeline_stage == PipelineStage.qualified:
        lead.status = LeadStatus.qualified
    if lead.pipeline_stage == PipelineStage.proposal:
        lead.status = LeadStatus.proposal
    if lead.pipeline_stage == PipelineStage.closed:
        lead.status = LeadStatus.won
    if lead.pipeline_stage == PipelineStage.lost:
        lead.status = LeadStatus.lost
    return lead


def get_lead_by_id(db: Session, lead_id: int) -> Lead | None:
    stmt = (
        select(Lead)
        .where(Lead.id == lead_id)
        .options(selectinload(Lead.activities), selectinload(Lead.interactions))
    )
    return db.scalars(stmt).first()


def list_leads(db: Session, params: LeadListParams) -> list[LeadOut]:
    stmt = (
        select(Lead)
        .options(selectinload(Lead.activities), selectinload(Lead.interactions))
        .order_by(Lead.updated_at.desc(), Lead.created_at.desc())
    )

    if params.status:
        stmt = stmt.where(Lead.status == LeadStatus(params.status))
    if params.pipeline_stage:
        stmt = stmt.where(Lead.pipeline_stage == PipelineStage(params.pipeline_stage))
    if params.search:
        pattern = f"%{params.search}%"
        stmt = stmt.where(
            or_(
                Lead.company_name.ilike(pattern),
                Lead.contact_name.ilike(pattern),
                Lead.email.ilike(pattern),
                Lead.city.ilike(pattern),
            )
        )

    leads = list(db.scalars(stmt).all())
    return [LeadOut.model_validate(lead) for lead in leads]


def create_lead(db: Session, payload: LeadCreate) -> LeadOut:
    lead = Lead(**payload.model_dump(), pipeline_stage=PipelineStage.new, status=LeadStatus.new)
    _apply_business_rules(lead, db)
    db.add(lead)
    db.flush()
    db.add(LeadActivity(lead_id=lead.id, type="created", description="Lead cadastrado manualmente."))
    db.add(
        LeadInteraction(
            lead_id=lead.id,
            content=lead.generated_message,
            summary="Mensagem inicial sugerida pela IA/local ao criar o lead.",
        )
    )
    db.commit()
    return LeadOut.model_validate(_hydrate_lead(lead, db))


def update_lead(db: Session, lead: Lead, payload: LeadUpdate) -> LeadOut:
    previous_stage = lead.pipeline_stage
    previous_next_action = lead.next_action
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)
    _apply_business_rules(lead, db)
    if lead.pipeline_stage != previous_stage:
        db.add(LeadActivity(lead_id=lead.id, type="pipeline", description=f"Lead movido para {lead.pipeline_stage.value}."))
    if lead.next_action != previous_next_action:
        db.add(LeadActivity(lead_id=lead.id, type="task", description=f"Proxima acao atualizada para: {lead.next_action}"))
    db.commit()
    return LeadOut.model_validate(_hydrate_lead(lead, db))


def delete_lead(db: Session, lead: Lead) -> None:
    db.delete(lead)
    db.commit()
