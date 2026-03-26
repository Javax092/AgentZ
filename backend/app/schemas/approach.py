from pydantic import BaseModel


class MessageRequest(BaseModel):
    lead_id: int | None = None
    custom_context: str | None = None


class MessageResponse(BaseModel):
    message: str
