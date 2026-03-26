from sqlalchemy import inspect, text

from app.db.session import Base, engine
from app.models.agent_settings import AgentSettings
from app.models.lead import Lead, LeadActivity

__all__ = ["Base", "Lead", "LeadActivity", "AgentSettings"]


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("leads"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("leads")}
    desired_columns = {
        "ai_analysis": "JSON",
        "ai_messages": "JSON",
        "ai_state": "JSON",
    }

    if not any(column not in existing_columns for column in desired_columns):
        return

    with engine.begin() as connection:
        for column_name, column_type in desired_columns.items():
            if column_name in existing_columns:
                continue
            connection.execute(text(f"ALTER TABLE leads ADD COLUMN {column_name} {column_type}"))
