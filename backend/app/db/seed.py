from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.enums import LeadStatus, PipelineStage
from app.schemas.lead import LeadCreate
from app.schemas.lead import LeadUpdate
from app.services.lead_service import create_lead, get_lead_by_id, update_lead
from app.services.settings_service import get_or_create_settings


def seed_database(db: Session) -> None:
    get_or_create_settings(db)
    if db.query(Lead).count() > 0:
        return

    samples = [
        (
            LeadCreate(
            company_name="Barbearia Vieiralves Prime",
            contact_name="Rafael Nogueira",
            email="rafael@vieiralvesprime.com.br",
            phone="(92) 99111-1201",
            niche="Barbearia",
            city="Manaus",
            company_size="small",
            solution_interest="automation",
            website_status="none",
            instagram_status="weak",
            monthly_budget=1800,
            urgency_days=5,
            source="instagram",
            pain_points=["agendamento no WhatsApp sem controle", "faltas recorrentes", "sem rotina de pos-venda"],
            tags=["barbearia", "zona-centro-sul", "reativacao"],
            notes="Opera forte por indicacao, mas perde horarios por desorganizacao do atendimento.",
            ),
            None,
        ),
        (
            LeadCreate(
            company_name="Clinica Sorriso Adrianopolis",
            contact_name="Dra. Juliana Castro",
            email="juliana@sorrisoadrianopolis.com.br",
            phone="(92) 99222-3402",
            niche="Clinicas",
            city="Manaus",
            company_size="medium",
            solution_interest="mixed",
            website_status="outdated",
            instagram_status="weak",
            monthly_budget=7200,
            urgency_days=7,
            source="indicacao",
            pain_points=["baixo agendamento de avaliacao", "follow-up manual", "site com baixa conversao"],
            tags=["saude", "alta-prioridade", "implantes"],
            notes="Quer organizar primeira consulta e confirmar faltosos automaticamente.",
            ),
            LeadUpdate(pipeline_stage=PipelineStage.diagnosis, status=LeadStatus.qualified),
        ),
        (
            LeadCreate(
            company_name="Amazon Home Imoveis",
            contact_name="Patricia Almeida",
            email="patricia@amazonhomeimoveis.com.br",
            phone="(92) 99333-5603",
            niche="Imobiliarias",
            city="Manaus",
            company_size="medium",
            solution_interest="automation",
            website_status="outdated",
            instagram_status="inactive",
            monthly_budget=5400,
            urgency_days=12,
            source="site",
            pain_points=["leads de portal sem resposta rapida", "corretores sem cadencia", "sem CRM leve"],
            tags=["crm", "imoveis", "alto-ticket"],
            notes="Busca centralizar atendimento de lancamentos e revenda.",
            ),
            LeadUpdate(pipeline_stage=PipelineStage.proposal, status=LeadStatus.proposal),
        ),
        (
            LeadCreate(
            company_name="Mobili Casa Amazonas",
            contact_name="Thiago Pereira",
            email="thiago@mobilicasaam.com.br",
            phone="(92) 99444-7804",
            niche="Loja de moveis",
            city="Manaus",
            company_size="small",
            solution_interest="landing_page",
            website_status="outdated",
            instagram_status="good",
            monthly_budget=3500,
            urgency_days=18,
            source="manual",
            pain_points=["catalogo sem captacao de orcamentos", "atendimento lento no direct"],
            tags=["varejo", "moveis", "catalogo"],
            notes="Boa demanda organica, mas sem estrutura para transformar visitas em pedidos.",
            ),
            None,
        ),
        (
            LeadCreate(
            company_name="Salao Bella Cachoeirinha",
            contact_name="Camila Ribeiro",
            email="camila@bellacachoeirinha.com.br",
            phone="(92) 99555-9105",
            niche="Salao de beleza",
            city="Manaus",
            company_size="small",
            solution_interest="automation",
            website_status="none",
            instagram_status="weak",
            monthly_budget=2200,
            urgency_days=9,
            source="instagram",
            pain_points=["agenda cheia sem confirmacao", "baixo retorno de clientes antigas"],
            tags=["beleza", "agenda", "whatsapp"],
            notes="Quer automatizar lembretes e campanhas de reativacao.",
            ),
            LeadUpdate(pipeline_stage=PipelineStage.diagnosis, status=LeadStatus.qualified),
        ),
        (
            LeadCreate(
            company_name="OrtoMais Clinica Integrada",
            contact_name="Dr. Bruno Tavares",
            email="bruno@ortomaismanaus.com.br",
            phone="(92) 99666-1106",
            niche="Clinicas",
            city="Manaus",
            company_size="medium",
            solution_interest="web_system",
            website_status="good",
            instagram_status="good",
            monthly_budget=9000,
            urgency_days=4,
            source="evento",
            pain_points=["triagem comercial descentralizada", "falta de dashboard de conversao", "equipe sem SLA"],
            tags=["saude", "premium", "sistema"],
            notes="Ja investe em trafego e precisa integrar captura, triagem e acompanhamento.",
            ),
            LeadUpdate(pipeline_stage=PipelineStage.negotiation, status=LeadStatus.negotiation),
        ),
        (
            LeadCreate(
            company_name="Reserva Ponta Negra Imoveis",
            contact_name="Leonardo Barros",
            email="leonardo@reservapontanegra.com.br",
            phone="(92) 99777-2307",
            niche="Imobiliarias",
            city="Manaus",
            company_size="medium",
            solution_interest="mixed",
            website_status="good",
            instagram_status="weak",
            monthly_budget=6800,
            urgency_days=20,
            source="meta-ads",
            pain_points=["lead frio entrando sem qualificacao", "retorno irregular dos corretores"],
            tags=["lancamentos", "crm", "qualificacao"],
            notes="Precisa separar lead de compra, aluguel e investimento antes do repasse.",
            ),
            LeadUpdate(pipeline_stage=PipelineStage.closed, status=LeadStatus.won),
        ),
        (
            LeadCreate(
            company_name="Barbearia Distrito 10",
            contact_name="Mateus Farias",
            email="mateus@distrito10barbearia.com.br",
            phone="(92) 99888-4508",
            niche="Barbearia",
            city="Manaus",
            company_size="small",
            solution_interest="landing_page",
            website_status="outdated",
            instagram_status="inactive",
            monthly_budget=1400,
            urgency_days=25,
            source="manual",
            pain_points=["dependencia de indicacao", "sem campanha de reativacao", "ausencia de landing page"],
            tags=["baixo-ticket", "captacao", "bairro"],
            notes="Aceita piloto enxuto para testar campanhas de agenda da semana.",
            ),
            None,
        ),
    ]

    for sample, patch in samples:
        created = create_lead(db, sample)
        if not patch:
            continue

        lead = get_lead_by_id(db, created.id)
        if lead:
            update_lead(db, lead, patch)
