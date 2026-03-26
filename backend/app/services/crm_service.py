from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import LeadStatus, PipelineStage
from app.models.lead import Lead, LeadActivity
from app.schemas.crm import CRMBoardLeadOut, CRMBoardOut, CRMColumnOut, LeadActivityCreate, PipelineMoveIn
from app.schemas.lead import LeadOut


def _status_for_stage(stage: PipelineStage) -> LeadStatus:
    mapping = {
        PipelineStage.new: LeadStatus.new,
        PipelineStage.contact_started: LeadStatus.contacted,
        PipelineStage.qualified: LeadStatus.qualified,
        PipelineStage.proposal: LeadStatus.proposal,
        PipelineStage.closed: LeadStatus.won,
        PipelineStage.lost: LeadStatus.lost,
    }
    return mapping.get(stage, LeadStatus.new)


def build_crm_board(db: Session) -> CRMBoardOut:
    stmt = select(Lead).options(selectinload(Lead.activities)).order_by(Lead.score.desc(), Lead.created_at.desc())
    leads = list(db.scalars(stmt).all())
    stage_order = [
        (PipelineStage.new, "Novo"),
        (PipelineStage.contact_started, "Contato iniciado"),
        (PipelineStage.qualified, "Qualificado"),
        (PipelineStage.proposal, "Proposta"),
        (PipelineStage.closed, "Fechado"),
        (PipelineStage.lost, "Perdido"),
    ]
    columns: list[CRMColumnOut] = []

    for stage, label in stage_order:
        stage_leads = [lead for lead in leads if lead.pipeline_stage == stage]
        columns.append(
            CRMColumnOut(
                stage=stage,
                label=label,
                count=len(stage_leads),
                leads=[
                    CRMBoardLeadOut(
                        id=lead.id,
                        company_name=lead.company_name,
                        contact_name=lead.contact_name,
                        score=lead.score,
                        score_label=lead.score_label,
                        status=lead.status.value,
                        next_action=lead.next_action,
                        owner_name=lead.owner_name,
                    )
                    for lead in stage_leads
                ],
            )
        )

    return CRMBoardOut(updated_at=datetime.utcnow(), columns=columns)


def move_lead_to_stage(db: Session, lead: Lead, payload: PipelineMoveIn) -> LeadOut:
    lead.pipeline_stage = payload.pipeline_stage
    lead.status = payload.status or _status_for_stage(payload.pipeline_stage)
    lead.last_contact_at = datetime.utcnow()
    if payload.pipeline_stage == PipelineStage.contact_started and not lead.next_action:
        lead.next_action = "Enviar follow-up"
    db.add(LeadActivity(lead_id=lead.id, type="pipeline", description=f"Etapa atualizada para {payload.pipeline_stage.value}."))
    db.commit()
    db.refresh(lead)
    return LeadOut.model_validate(
        db.scalars(select(Lead).where(Lead.id == lead.id).options(selectinload(Lead.activities), selectinload(Lead.interactions))).first()
    )


def add_activity_to_lead(db: Session, lead: Lead, payload: LeadActivityCreate) -> LeadOut:
    lead.last_contact_at = datetime.utcnow()
    db.add(LeadActivity(lead_id=lead.id, type=payload.type, description=payload.description))
    db.commit()
    db.refresh(lead)
    return LeadOut.model_validate(
        db.scalars(select(Lead).where(Lead.id == lead.id).options(selectinload(Lead.activities), selectinload(Lead.interactions))).first()
    )
