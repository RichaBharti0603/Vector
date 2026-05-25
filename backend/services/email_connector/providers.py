from abc import ABC, abstractmethod
from typing import List, Optional
import logging
from .email_models import NormalizedEmail, TokenData
from .oauth_manager import oauth_manager

logger = logging.getLogger("EmailProvider")

class EmailProvider(ABC):
    @abstractmethod
    def authenticate(self, code: str) -> TokenData:
        pass

    @abstractmethod
    def watch_inbox(self):
        pass

    @abstractmethod
    def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        pass

class GmailProvider(EmailProvider):
    def authenticate(self, code: str) -> TokenData:
        logger.info(f"Authenticating Gmail with code: {code}")
        # Mock OAuth exchange
        return TokenData(access_token="mock_gmail_access", provider="gmail", user_id="user_1")

    def watch_inbox(self):
        logger.info("Setting up Gmail watch API (Pub/Sub)")
        # In production: call users().watch()

    def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        if not oauth_manager.is_connected(user_id, "gmail"):
            return []
        
        # Mocking fetch for fallback mode
        return []

class OutlookProvider(EmailProvider):
    def authenticate(self, code: str) -> TokenData:
        logger.info(f"Authenticating Outlook with code: {code}")
        # Mock OAuth exchange
        return TokenData(access_token="mock_outlook_access", provider="outlook", user_id="user_1")

    def watch_inbox(self):
        logger.info("Setting up Microsoft Graph Webhooks")
        # In production: create subscription to /me/messages

    def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        if not oauth_manager.is_connected(user_id, "outlook"):
            return []
            
        # Mocking fetch for fallback mode
        return []
