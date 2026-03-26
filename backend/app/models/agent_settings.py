from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AgentSettings(Base):
    __tablename__ = "agent_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    company_name: Mapped[str] = mapped_column(String(120), nullable=False, default="LeadFlow Studio")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="CRM com IA para captar, qualificar e converter leads.")
    niche: Mapped[str] = mapped_column(String(120), nullable=False, default="Servicos locais")
    city: Mapped[str] = mapped_column(String(120), nullable=False, default="Manaus")
    service_type: Mapped[str] = mapped_column(String(120), nullable=False, default="WhatsApp, Instagram e comercial consultivo")
    ai_tone: Mapped[str] = mapped_column(String(60), nullable=False, default="consultivo")
    primary_goal: Mapped[str] = mapped_column(String(180), nullable=False, default="Converter mais leads em propostas e reunioes")
    initial_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Oi, {{lead_name}}. Notei potencial de ganho comercial na {{company_name}} e tenho uma sugestao pratica para aumentar a conversao.",
    )
    follow_up_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Retomando nosso contato porque ainda vejo oportunidade clara de acelerar seu atendimento comercial.",
    )
    follow_up_delay_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    max_follow_up_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    hot_lead_score_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=80)
    webhook_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    provider_name: Mapped[str] = mapped_column(String(60), nullable=False, default="gemini")
    provider_api_key: Mapped[str] = mapped_column(Text, nullable=False, default="")
    positioning: Mapped[str] = mapped_column(Text, nullable=False, default="Automações, landing pages e sistemas web sob medida.")
    target_niches: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    target_cities: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    qualification_rules: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    prompt_tone: Mapped[str] = mapped_column(String(60), nullable=False, default="consultivo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow)
