from sqlalchemy import inspect, text

from app.db.session import Base, engine
from app.models.agent_settings import AgentSettings
from app.models.lead import Lead, LeadActivity, LeadInteraction
from app.models.message_template import MessageTemplate
from app.models.user import User

__all__ = ["Base", "Lead", "LeadActivity", "LeadInteraction", "AgentSettings", "MessageTemplate", "User"]


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    with engine.begin() as connection:
        if inspector.has_table("leads"):
            existing_lead_columns = {column["name"] for column in inspector.get_columns("leads")}
            desired_lead_columns = {
                "ai_analysis": "JSON",
                "ai_messages": "JSON",
                "ai_state": "JSON",
                "owner_name": "VARCHAR(120) NOT NULL DEFAULT 'Equipe comercial'",
                "interest_summary": "VARCHAR(160) NOT NULL DEFAULT ''",
                "next_action": "TEXT NOT NULL DEFAULT ''",
                "next_action_at": "DATETIME",
            }
            for column_name, column_type in desired_lead_columns.items():
                if column_name in existing_lead_columns:
                    continue
                connection.execute(text(f"ALTER TABLE leads ADD COLUMN {column_name} {column_type}"))

            connection.execute(
                text(
                    """
                    UPDATE leads
                    SET pipeline_stage = CASE pipeline_stage
                        WHEN 'entrada' THEN 'novo'
                        WHEN 'diagnostico' THEN 'contato_iniciado'
                        WHEN 'negociacao' THEN 'proposta'
                        ELSE pipeline_stage
                    END
                    WHERE pipeline_stage IN ('entrada', 'diagnostico', 'negociacao')
                    """
                )
            )
            connection.execute(
                text(
                    """
                    UPDATE leads
                    SET status = CASE status
                        WHEN 'new' THEN 'new'
                        WHEN 'qualified' THEN 'qualified'
                        WHEN 'proposal' THEN 'proposal'
                        WHEN 'negotiation' THEN 'proposal'
                        WHEN 'won' THEN 'won'
                        WHEN 'lost' THEN 'lost'
                        ELSE status
                    END
                    WHERE status IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')
                    """
                )
            )

        if inspector.has_table("agent_settings"):
            existing_settings_columns = {column["name"] for column in inspector.get_columns("agent_settings")}
            desired_settings_columns = {
                "description": "TEXT NOT NULL DEFAULT 'CRM com IA para captar, qualificar e converter leads.'",
                "niche": "VARCHAR(120) NOT NULL DEFAULT 'Servicos locais'",
                "city": "VARCHAR(120) NOT NULL DEFAULT 'Manaus'",
                "service_type": "VARCHAR(120) NOT NULL DEFAULT 'WhatsApp, Instagram e comercial consultivo'",
                "ai_tone": "VARCHAR(60) NOT NULL DEFAULT 'consultivo'",
                "primary_goal": "VARCHAR(180) NOT NULL DEFAULT 'Converter mais leads em propostas e reunioes'",
                "initial_message": "TEXT NOT NULL DEFAULT 'Oi, {{lead_name}}. Notei potencial de ganho comercial na {{company_name}} e tenho uma sugestao pratica para aumentar a conversao.'",
                "follow_up_message": "TEXT NOT NULL DEFAULT 'Retomando nosso contato porque ainda vejo oportunidade clara de acelerar seu atendimento comercial.'",
                "follow_up_delay_hours": "INTEGER NOT NULL DEFAULT 24",
                "max_follow_up_attempts": "INTEGER NOT NULL DEFAULT 4",
                "hot_lead_score_threshold": "INTEGER NOT NULL DEFAULT 80",
                "webhook_url": "TEXT NOT NULL DEFAULT ''",
                "provider_name": "VARCHAR(60) NOT NULL DEFAULT 'gemini'",
                "provider_api_key": "TEXT NOT NULL DEFAULT ''",
            }
            for column_name, column_type in desired_settings_columns.items():
                if column_name in existing_settings_columns:
                    continue
                connection.execute(text(f"ALTER TABLE agent_settings ADD COLUMN {column_name} {column_type}"))
