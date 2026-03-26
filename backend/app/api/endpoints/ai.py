from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.ai import AIFullAnalysisRequest, AIHealthOut, AIMessageRequest, AINextActionOut, AISuggestResponseOut, AISummaryOut
from app.schemas.lead import LeadOut
from app.services.ai_service import ai_health, analyze_lead, generate_full_analysis, generate_lead_messages, recommend_next_action, suggest_response, summarize_lead
from app.services.lead_service import get_lead_by_id

router = APIRouter()


@router.get("/health", response_model=AIHealthOut)
def get_ai_health() -> AIHealthOut:
    return ai_health()


@router.post("/leads/{lead_id}/analyze", response_model=LeadOut)
def post_lead_analysis(lead_id: int, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return LeadOut.model_validate(analyze_lead(db, lead))


@router.post("/leads/{lead_id}/messages", response_model=LeadOut)
def post_lead_messages(lead_id: int, payload: AIMessageRequest, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return LeadOut.model_validate(generate_lead_messages(db, lead, payload.custom_context))


@router.post("/leads/{lead_id}/full-analysis", response_model=LeadOut)
def post_lead_full_analysis(lead_id: int, payload: AIFullAnalysisRequest, db: Session = Depends(get_db)) -> LeadOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return LeadOut.model_validate(generate_full_analysis(db, lead, payload.custom_context))


@router.post("/leads/{lead_id}/suggest-response", response_model=AISuggestResponseOut)
def post_suggest_response(lead_id: int, db: Session = Depends(get_db)) -> AISuggestResponseOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return suggest_response(db, lead)


@router.get("/leads/{lead_id}/summary", response_model=AISummaryOut)
def get_lead_summary(lead_id: int, db: Session = Depends(get_db)) -> AISummaryOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return summarize_lead(db, lead)


@router.get("/leads/{lead_id}/next-action", response_model=AINextActionOut)
def get_lead_next_action(lead_id: int, db: Session = Depends(get_db)) -> AINextActionOut:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado")
    return recommend_next_action(db, lead)
