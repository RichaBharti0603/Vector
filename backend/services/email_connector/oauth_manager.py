import time
from typing import Dict, Optional
from .email_models import TokenData

class OAuthManager:
    def __init__(self):
        # In-memory store for MVP. In production, use encrypted DB or KeyVault.
        self._tokens: Dict[str, TokenData] = {}

    def save_token(self, user_id: str, token_data: TokenData):
        self._tokens[user_id] = token_data

    def get_token(self, user_id: str) -> Optional[TokenData]:
        token = self._tokens.get(user_id)
        if token and token.expires_at and token.expires_at < time.time():
            # Handle refresh logic here in production
            pass
        return token

    def is_connected(self, user_id: str, provider: str) -> bool:
        token = self._tokens.get(user_id)
        return bool(token and token.provider == provider)

oauth_manager = OAuthManager()
