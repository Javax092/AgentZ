from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.crm import CRMBoardOut, LeadActivityCreate, PipelineMoveIn
from app.schemas.lead import LeadOut
from app.services.crm_service import add_activity_to_lead, build_crm_board, move_lead_to_stage
from app.services.lead_service import get_lead_by_id

router = APIRouter()


@router.get("/board", response_model=CRMBoardOut)
def get_board(db: Session = Depends(get_db)) -> CRMBoardOut:
    return build_crm_board(db)


@router.post("/leads/{lead_id}/move", response_model=LeadOut)
def move_pipeline(lead_id: int, payload: PipelineMoveIn, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return move_lead_to_stage(db, lead, payload)


@router.post("/leads/{lead_id}/activities", response_model=LeadOut)
def create_activity(lead_id: int, payload: LeadActivityCreate, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return add_activity_to_lead(db, lead, payload)
