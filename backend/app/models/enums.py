from enum import Enum


class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class PipelineStage(str, Enum):
    new = "novo"
    contact_started = "contato_iniciado"
    qualified = "qualificado"
    proposal = "proposta"
    closed = "fechado"
    lost = "perdido"


class SolutionInterest(str, Enum):
    automation = "automation"
    landing_page = "landing_page"
    web_system = "web_system"
    mixed = "mixed"


class MessageChannel(str, Enum):
    whatsapp = "whatsapp"
    email = "email"
    call = "call"
    note = "note"


class MessageDirection(str, Enum):
    inbound = "inbound"
    outbound = "outbound"
    internal = "internal"
