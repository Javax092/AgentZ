from sqlalchemy.orm import Session

from app.models.enums import MessageChannel, MessageDirection
from app.models.lead import Lead
from app.models.message_template import MessageTemplate
from app.models.user import User
from app.models.enums import LeadStatus, PipelineStage
from app.schemas.lead import LeadCreate
from app.schemas.lead import LeadUpdate
from app.schemas.messages import LeadInteractionIn, MessageTemplateIn
from app.services.lead_service import create_lead, get_lead_by_id, update_lead
from app.services.message_service import create_interaction, create_template
from app.services.settings_service import get_or_create_settings


def seed_database(db: Session) -> None:
    settings = get_or_create_settings(db)
    if not settings.description:
        settings.description = "CRM com IA para captar, qualificar e converter leads de pequenos negocios."
        db.commit()

    if db.query(User).count() == 0:
        db.add(User(name="Admin Demo", email="admin@leadflow.ai", role="admin", password_hash="demo-password"))
        db.commit()

    if db.query(MessageTemplate).count() == 0:
        create_template(
            db,
            MessageTemplateIn(
                name="Abordagem inicial WhatsApp",
                channel=MessageChannel.whatsapp,
                goal="primeiro_contato",
                content="Oi, {{lead_name}}. Analisei a operacao da {{company_name}} e vi uma oportunidade clara de melhorar o fluxo comercial. Posso te mostrar uma ideia objetiva?",
                is_active=True,
            ),
        )
        create_template(
            db,
            MessageTemplateIn(
                name="Follow-up consultivo",
                channel=MessageChannel.whatsapp,
                goal="follow_up",
                content="Oi, {{lead_name}}. Retomando nosso contato porque ainda vejo espaco para a {{company_name}} ganhar velocidade nas vendas. Quer que eu te envie uma sugestao pratica?",
                is_active=True,
            ),
        )
        create_template(
            db,
            MessageTemplateIn(
                name="Resumo por email",
                channel=MessageChannel.email,
                goal="resumo_proposta",
                content="Assunto: Oportunidade comercial para {{company_name}}\n\nOla, {{lead_name}}. Estruturei uma recomendacao objetiva para melhorar captacao, qualificacao e follow-up.",
                is_active=True,
            ),
        )

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
            LeadUpdate(pipeline_stage=PipelineStage.qualified, status=LeadStatus.qualified, next_action="Agendar reuniao de diagnostico"),
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
            LeadUpdate(pipeline_stage=PipelineStage.proposal, status=LeadStatus.proposal, next_action="Apresentar proposta comercial"),
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
            LeadUpdate(pipeline_stage=PipelineStage.contact_started, status=LeadStatus.contacted, next_action="Enviar follow-up no WhatsApp"),
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
            LeadUpdate(pipeline_stage=PipelineStage.proposal, status=LeadStatus.proposal, next_action="Negociar escopo e ROI"),
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
            LeadUpdate(pipeline_stage=PipelineStage.closed, status=LeadStatus.won, next_action="Iniciar onboarding"),
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
            lead = get_lead_by_id(db, created.id)
            if lead:
                create_interaction(
                    db,
                    lead,
                    LeadInteractionIn(
                        channel=MessageChannel.whatsapp,
                        direction=MessageDirection.outbound,
                        status="sent",
                        content=lead.generated_message,
                        summary="Mensagem inicial disparada ao criar lead seed.",
                    ),
                )
            continue

        lead = get_lead_by_id(db, created.id)
        if lead:
            update_lead(db, lead, patch)
            refreshed = get_lead_by_id(db, created.id)
            if refreshed:
                create_interaction(
                    db,
                    refreshed,
                    LeadInteractionIn(
                        channel=MessageChannel.whatsapp,
                        direction=MessageDirection.outbound,
                        status="sent",
                        content=refreshed.generated_message,
                        summary="Contato comercial inicial registrado no seed.",
                    ),
                )
