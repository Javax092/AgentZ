from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.enums import LeadStatus, PipelineStage
from app.schemas.lead import LeadCreate, LeadListParams, LeadOut, LeadUpdate
from app.services.lead_service import create_lead, delete_lead, get_lead_by_id, list_leads, update_lead

router = APIRouter()


@router.get("", response_model=list[LeadOut])
def get_leads(
    status_filter: LeadStatus | None = Query(default=None, alias="status"),
    pipeline_stage: PipelineStage | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[LeadOut]:
    params = LeadListParams(status=status_filter, pipeline_stage=pipeline_stage, search=search)
    return list_leads(db, params)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def post_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> LeadOut:
    return create_lead(db, payload)


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def put_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return update_lead(db, lead, payload)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_lead(lead_id: int, db: Session = Depends(get_db)) -> None:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    delete_lead(db, lead)
