from enum import Enum


class LeadStatus(str, Enum):
    new = "new"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class PipelineStage(str, Enum):
    entry = "entrada"
    diagnosis = "diagnostico"
    proposal = "proposta"
    negotiation = "negociacao"
    closed = "fechado"


class SolutionInterest(str, Enum):
    automation = "automation"
    landing_page = "landing_page"
    web_system = "web_system"
    mixed = "mixed"
