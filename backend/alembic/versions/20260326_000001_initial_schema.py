from alembic import op
import sqlalchemy as sa


revision = "20260326_000001"
down_revision = None
branch_labels = None
depends_on = None


lead_status = sa.Enum("new", "contacted", "qualified", "proposal", "negotiation", "won", "lost", name="leadstatus")
pipeline_stage = sa.Enum("novo", "contato_iniciado", "qualificado", "proposta", "fechado", "perdido", name="pipelinestage")
solution_interest = sa.Enum("automation", "landing_page", "web_system", "mixed", name="solutioninterest")
message_channel = sa.Enum("whatsapp", "email", "call", "note", name="messagechannel")
message_direction = sa.Enum("inbound", "outbound", "internal", name="messagedirection")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgresql = bind.dialect.name == "postgresql"

    if is_postgresql:
        lead_status.create(bind, checkfirst=True)
        pipeline_stage.create(bind, checkfirst=True)
        solution_interest.create(bind, checkfirst=True)
        message_channel.create(bind, checkfirst=True)
        message_direction.create(bind, checkfirst=True)

    op.create_table(
        "agent_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("niche", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("service_type", sa.String(length=120), nullable=False),
        sa.Column("ai_tone", sa.String(length=60), nullable=False),
        sa.Column("primary_goal", sa.String(length=180), nullable=False),
        sa.Column("initial_message", sa.Text(), nullable=False),
        sa.Column("follow_up_message", sa.Text(), nullable=False),
        sa.Column("follow_up_delay_hours", sa.Integer(), nullable=False),
        sa.Column("max_follow_up_attempts", sa.Integer(), nullable=False),
        sa.Column("hot_lead_score_threshold", sa.Integer(), nullable=False),
        sa.Column("webhook_url", sa.Text(), nullable=False),
        sa.Column("provider_name", sa.String(length=60), nullable=False),
        sa.Column("positioning", sa.Text(), nullable=False),
        sa.Column("target_niches", sa.JSON(), nullable=False),
        sa.Column("target_cities", sa.JSON(), nullable=False),
        sa.Column("qualification_rules", sa.JSON(), nullable=False),
        sa.Column("prompt_tone", sa.String(length=60), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
    )

    op.create_table(
        "message_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("channel", message_channel, nullable=False),
        sa.Column("goal", sa.String(length=80), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_name", sa.String(length=140), nullable=False),
        sa.Column("contact_name", sa.String(length=140), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("niche", sa.String(length=80), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("owner_name", sa.String(length=120), nullable=False),
        sa.Column("interest_summary", sa.String(length=160), nullable=False),
        sa.Column("company_size", sa.String(length=40), nullable=False),
        sa.Column("solution_interest", solution_interest, nullable=False),
        sa.Column("website_status", sa.String(length=40), nullable=False),
        sa.Column("instagram_status", sa.String(length=40), nullable=False),
        sa.Column("monthly_budget", sa.Float(), nullable=False),
        sa.Column("urgency_days", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("pain_points", sa.JSON(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("score_label", sa.String(length=30), nullable=False),
        sa.Column("next_action", sa.Text(), nullable=False),
        sa.Column("next_action_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("diagnosis", sa.Text(), nullable=False),
        sa.Column("suggested_offer", sa.Text(), nullable=False),
        sa.Column("generated_message", sa.Text(), nullable=False),
        sa.Column("ai_analysis", sa.JSON(), nullable=True),
        sa.Column("ai_messages", sa.JSON(), nullable=True),
        sa.Column("ai_state", sa.JSON(), nullable=True),
        sa.Column("status", lead_status, nullable=False),
        sa.Column("pipeline_stage", pipeline_stage, nullable=False),
        sa.Column("last_contact_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
    )
    op.create_index("ix_leads_company_name", "leads", ["company_name"], unique=False)
    op.create_index("ix_leads_email", "leads", ["email"], unique=True)
    op.create_index("ix_leads_city", "leads", ["city"], unique=False)
    op.create_index("ix_leads_niche", "leads", ["niche"], unique=False)

    op.create_table(
        "lead_activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
    )
    op.create_index("ix_lead_activities_lead_id", "lead_activities", ["lead_id"], unique=False)

    op.create_table(
        "lead_interactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", message_channel, nullable=False),
        sa.Column("direction", message_direction, nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("subject", sa.String(length=180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=False), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
    )
    op.create_index("ix_lead_interactions_lead_id", "lead_interactions", ["lead_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    is_postgresql = bind.dialect.name == "postgresql"

    op.drop_index("ix_lead_interactions_lead_id", table_name="lead_interactions")
    op.drop_table("lead_interactions")
    op.drop_index("ix_lead_activities_lead_id", table_name="lead_activities")
    op.drop_table("lead_activities")
    op.drop_index("ix_leads_niche", table_name="leads")
    op.drop_index("ix_leads_city", table_name="leads")
    op.drop_index("ix_leads_email", table_name="leads")
    op.drop_index("ix_leads_company_name", table_name="leads")
    op.drop_table("leads")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("message_templates")
    op.drop_table("agent_settings")

    if is_postgresql:
        message_direction.drop(bind, checkfirst=True)
        message_channel.drop(bind, checkfirst=True)
        solution_interest.drop(bind, checkfirst=True)
        pipeline_stage.drop(bind, checkfirst=True)
        lead_status.drop(bind, checkfirst=True)
