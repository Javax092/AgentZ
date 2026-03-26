from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AgentSettings(Base):
    __tablename__ = "agent_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    company_name: Mapped[str] = mapped_column(String(120), nullable=False, default="LeadFlow Studio")
    positioning: Mapped[str] = mapped_column(Text, nullable=False, default="Automações, landing pages e sistemas web sob medida.")
    target_niches: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    target_cities: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    qualification_rules: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    prompt_tone: Mapped[str] = mapped_column(String(60), nullable=False, default="consultivo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow)
