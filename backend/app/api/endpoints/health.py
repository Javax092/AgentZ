from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from fastapi import Depends

router = APIRouter()


@router.get("/health")
def healthcheck(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("select 1"))
    return {"status": "ok", "service": "leadflow-api"}
