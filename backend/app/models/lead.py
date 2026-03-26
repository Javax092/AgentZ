from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import LeadStatus, PipelineStage, SolutionInterest


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_name: Mapped[str] = mapped_column(String(140), nullable=False, index=True)
    contact_name: Mapped[str] = mapped_column(String(140), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    niche: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    company_size: Mapped[str] = mapped_column(String(40), nullable=False, default="small")
    solution_interest: Mapped[SolutionInterest] = mapped_column(SqlEnum(SolutionInterest), nullable=False)
    website_status: Mapped[str] = mapped_column(String(40), nullable=False, default="outdated")
    instagram_status: Mapped[str] = mapped_column(String(40), nullable=False, default="inactive")
    monthly_budget: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    urgency_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    source: Mapped[str] = mapped_column(String(80), nullable=False, default="manual")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pain_points: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_label: Mapped[str] = mapped_column(String(30), nullable=False, default="cold")
    diagnosis: Mapped[str] = mapped_column(Text, nullable=False, default="")
    suggested_offer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    generated_message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    ai_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_messages: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[LeadStatus] = mapped_column(SqlEnum(LeadStatus), nullable=False, default=LeadStatus.new)
    pipeline_stage: Mapped[PipelineStage] = mapped_column(SqlEnum(PipelineStage), nullable=False, default=PipelineStage.entry)
    last_contact_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow)

    activities: Mapped[list["LeadActivity"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by=lambda: LeadActivity.created_at.desc(),
    )


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship(back_populates="activities")
