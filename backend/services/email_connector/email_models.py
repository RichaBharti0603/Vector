from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NormalizedEmail(BaseModel):
    subject: str
    body: str
    sender: str
    timestamp: Optional[datetime] = None
    provider: str

class TokenData(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[float] = None
    provider: str
    user_id: str
