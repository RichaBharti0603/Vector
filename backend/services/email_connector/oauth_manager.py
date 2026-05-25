import time
from typing import Dict, Optional
from .email_models import TokenData

class OAuthManager:
    def __init__(self):
        # In-memory store for MVP. In production, use encrypted DB or KeyVault.
        self._tokens: Dict[str, TokenData] = {}

    def save_token(self, user_id: str, token_data: TokenData):
        key = f"{user_id}:{token_data.provider}"
        self._tokens[key] = token_data

    def get_token(self, user_id: str, provider: str) -> Optional[TokenData]:
        key = f"{user_id}:{provider}"
        token = self._tokens.get(key)
        if token and token.expires_at and token.expires_at < time.time():
            # Handle refresh logic here in production
            pass
        return token

    def is_connected(self, user_id: str, provider: str) -> bool:
        key = f"{user_id}:{provider}"
        token = self._tokens.get(key)
        return bool(token)

oauth_manager = OAuthManager()
