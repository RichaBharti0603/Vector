import os
import time
import logging
import httpx
from abc import ABC, abstractmethod
from typing import List, Optional
from .email_models import NormalizedEmail, TokenData
from .oauth_manager import oauth_manager

logger = logging.getLogger("EmailProvider")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI", "http://localhost:8000/auth/microsoft/callback")

class EmailProvider(ABC):
    @abstractmethod
    async def authenticate(self, code: str, user_id: str) -> TokenData:
        pass

    @abstractmethod
    async def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        pass

class GmailProvider(EmailProvider):
    async def authenticate(self, code: str, user_id: str) -> TokenData:
        logger.info(f"Authenticating Gmail with code: {code}")
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or code.startswith("mock_"):
            # Fallback to mock login
            logger.info("Using mock authentication for Gmail")
            return TokenData(
                access_token=f"mock_gmail_access_{int(time.time())}",
                refresh_token="mock_gmail_refresh",
                expires_at=time.time() + 3600,
                provider="gmail",
                user_id=user_id
            )
        
        # Real OAuth2 code exchange
        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "redirect_uri": GOOGLE_REDIRECT_URI,
                        "grant_type": "authorization_code"
                    }
                )
                res.raise_for_status()
                data = res.json()
                return TokenData(
                    access_token=data["access_token"],
                    refresh_token=data.get("refresh_token"),
                    expires_at=time.time() + data.get("expires_in", 3600),
                    provider="gmail",
                    user_id=user_id
                )
            except Exception as e:
                logger.error(f"Failed to authenticate with Google: {e}")
                raise e

    async def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        token_data = oauth_manager.get_token(user_id, "gmail")
        if not token_data:
            return []
        
        # If it's a mock token, let the poller handle mock generation separately or return empty
        if token_data.access_token.startswith("mock_"):
            return []

        # Real Google Gmail API polling
        headers = {"Authorization": f"Bearer {token_data.access_token}"}
        async with httpx.AsyncClient() as client:
            try:
                # 1. List unread messages
                res = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread",
                    headers=headers
                )
                res.raise_for_status()
                messages_data = res.json()
                messages = messages_data.get("messages", [])
                
                emails = []
                # Fetch first 5 unread messages to avoid rate limits
                for msg_summary in messages[:5]:
                    msg_id = msg_summary["id"]
                    msg_res = await client.get(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}",
                        headers=headers
                    )
                    msg_res.raise_for_status()
                    msg_detail = msg_res.json()
                    
                    # Extract headers
                    headers_list = msg_detail.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "No Subject")
                    sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "unknown@domain.com")
                    snippet = msg_detail.get("snippet", "")
                    
                    emails.append(NormalizedEmail(
                        subject=subject,
                        body=snippet,
                        sender=sender,
                        provider="gmail"
                    ))
                    
                    # Mark message as read so we don't fetch it again
                    await client.post(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}/batchModify",
                        headers=headers,
                        json={"removeLabelIds": ["UNREAD"]}
                    )
                return emails
            except Exception as e:
                logger.error(f"Error fetching Gmail: {e}")
                return []

class OutlookProvider(EmailProvider):
    async def authenticate(self, code: str, user_id: str) -> TokenData:
        logger.info(f"Authenticating Outlook with code: {code}")
        if not MICROSOFT_CLIENT_ID or not MICROSOFT_CLIENT_SECRET or code.startswith("mock_"):
            # Fallback to mock login
            logger.info("Using mock authentication for Outlook")
            return TokenData(
                access_token=f"mock_outlook_access_{int(time.time())}",
                refresh_token="mock_outlook_refresh",
                expires_at=time.time() + 3600,
                provider="outlook",
                user_id=user_id
            )
            
        # Real Microsoft Graph OAuth2 code exchange
        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(
                    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                    data={
                        "client_id": MICROSOFT_CLIENT_ID,
                        "client_secret": MICROSOFT_CLIENT_SECRET,
                        "code": code,
                        "redirect_uri": MICROSOFT_REDIRECT_URI,
                        "grant_type": "authorization_code",
                        "scope": "https://graph.microsoft.com/Mail.Read offline_access"
                    }
                )
                res.raise_for_status()
                data = res.json()
                return TokenData(
                    access_token=data["access_token"],
                    refresh_token=data.get("refresh_token"),
                    expires_at=time.time() + data.get("expires_in", 3600),
                    provider="outlook",
                    user_id=user_id
                )
            except Exception as e:
                logger.error(f"Failed to authenticate with Microsoft: {e}")
                raise e

    async def fetch_new_emails(self, user_id: str) -> List[NormalizedEmail]:
        token_data = oauth_manager.get_token(user_id, "outlook")
        if not token_data:
            return []
            
        if token_data.access_token.startswith("mock_"):
            return []

        # Real Outlook Graph API polling
        headers = {"Authorization": f"Bearer {token_data.access_token}"}
        async with httpx.AsyncClient() as client:
            try:
                # Fetch recent unread messages
                res = await client.get(
                    "https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$filter=isRead eq false&$select=subject,from,bodyPreview",
                    headers=headers
                )
                res.raise_for_status()
                messages = res.json().get("value", [])
                
                emails = []
                for msg in messages[:5]:
                    subject = msg.get("subject", "No Subject")
                    sender_info = msg.get("from", {}).get("emailAddress", {})
                    sender = f"{sender_info.get('name', '')} <{sender_info.get('address', 'unknown@domain.com')}>"
                    body_preview = msg.get("bodyPreview", "")
                    
                    emails.append(NormalizedEmail(
                        subject=subject,
                        body=body_preview,
                        sender=sender,
                        provider="outlook"
                    ))
                    
                    # Mark message as read
                    msg_id = msg["id"]
                    await client.patch(
                        f"https://graph.microsoft.com/v1.0/me/messages/{msg_id}",
                        headers=headers,
                        json={"isRead": True}
                    )
                return emails
            except Exception as e:
                logger.error(f"Error fetching Outlook: {e}")
                return []
