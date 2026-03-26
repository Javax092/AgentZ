import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

PROJECT_BACKEND = Path(__file__).resolve().parents[1]
if str(PROJECT_BACKEND) not in sys.path:
    sys.path.insert(0, str(PROJECT_BACKEND))

from app.schemas.ai import LeadAIAnalysis, LeadAIRecommendedService, LeadAIScore, LeadAIScoreFactor
from app.schemas.lead import LeadCreate
from app.services.ai_service import ai_health, analyze_lead, generate_full_analysis, generate_lead_messages
from app.services.lead_service import create_lead, get_lead_by_id
from app.services.settings_service import get_or_create_settings
from app.db.session import Base


def _sample_lead() -> LeadCreate:
    return LeadCreate(
        company_name="Clinica Mockada",
        contact_name="Ana Teste",
        email="ana.teste@example.com",
        phone="(92) 99999-0000",
        niche="Clinicas",
        city="Manaus",
        company_size="medium",
        solution_interest="automation",
        website_status="outdated",
        instagram_status="weak",
        monthly_budget=6500,
        urgency_days=7,
        source="teste",
        notes="Lead criado para testes de IA.",
        pain_points=["follow-up manual", "baixa resposta comercial"],
        tags=["teste", "ia"],
    )


def _gemini_analysis() -> LeadAIAnalysis:
    return LeadAIAnalysis(
        summary="Lead aderente e com oportunidade comercial clara.",
        diagnosis="A operacao perde velocidade no follow-up e tem maturidade digital mediana.",
        score=LeadAIScore(
            value=91,
            label="hot",
            explanation="Score alto por orcamento, urgencia e aderencia ao ICP.",
            factors=[
                LeadAIScoreFactor(title="Orcamento", impact="positive", detail="Budget suficiente para um piloto."),
            ],
        ),
        recommended_service=LeadAIRecommendedService(
            name="Automacao comercial consultiva",
            rationale="As dores apontam para triagem e follow-up.",
            expected_outcome="Ganhar velocidade comercial e previsibilidade.",
        ),
        next_steps=["Agendar diagnostico comercial"],
    )


class AIEndpointsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        self.session_local = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.session_local()
        get_or_create_settings(self.db)
        lead = create_lead(self.db, _sample_lead())
        self.lead = get_lead_by_id(self.db, lead.id)

    def tearDown(self) -> None:
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    @patch("app.services.ai_service._gemini_analysis")
    def test_analyze_persists_gemini_output(self, gemini_analysis_mock) -> None:
        gemini_analysis_mock.return_value = _gemini_analysis()

        lead = analyze_lead(self.db, self.lead)

        self.assertEqual(lead.score, 91)
        self.assertEqual(lead.ai_state["analysis_source"], "gemini")
        self.assertEqual(lead.ai_analysis["recommended_service"]["name"], "Automacao comercial consultiva")
        self.assertEqual(lead.diagnosis, "A operacao perde velocidade no follow-up e tem maturidade digital mediana.")

    @patch("app.services.ai_service.get_gemini_status", return_value={"enabled": True})
    @patch("app.services.ai_service._gemini_messages", side_effect=RuntimeError("timeout simulado"))
    def test_messages_fall_back_to_local_when_gemini_fails(self, _, __) -> None:
        lead = generate_lead_messages(self.db, self.lead, "Campanha de reativacao")

        self.assertEqual(lead.ai_state["messages_source"], "local")
        self.assertTrue(lead.ai_state["fallback_used"])
        self.assertIn("timeout simulado", lead.ai_state["last_error"])
        self.assertIn("Campanha de reativacao", lead.ai_messages["whatsapp"])

    @patch("app.services.ai_service.get_gemini_status", return_value={"enabled": True})
    @patch("app.services.ai_service._gemini_messages", side_effect=RuntimeError("falha mensagens"))
    @patch("app.services.ai_service._gemini_analysis", side_effect=RuntimeError("falha analise"))
    def test_full_analysis_uses_local_fallback_and_persists_both(self, _, __, ___) -> None:
        lead = generate_full_analysis(self.db, self.lead, "Fechamento ainda neste mes")

        self.assertEqual(lead.ai_state["analysis_source"], "local")
        self.assertEqual(lead.ai_state["messages_source"], "local")
        self.assertTrue(lead.ai_messages["email_subject"])
        self.assertTrue(lead.ai_analysis["next_steps"])

    def test_ai_health_returns_gemini_status_shape(self) -> None:
        payload = ai_health().model_dump()

        self.assertIn("enabled", payload)
        self.assertIn("available", payload)
        self.assertIn("mode", payload)
        self.assertEqual(payload["provider"], "gemini")


if __name__ == "__main__":
    unittest.main()
