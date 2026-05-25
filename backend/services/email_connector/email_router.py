import asyncio
import logging
import json
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from .email_models import NormalizedEmail
from .providers import GmailProvider, OutlookProvider
from .oauth_manager import oauth_manager
from .privacy_layer import PrivacyLayer
import sys
import os

# Ensure we can import core.redis_bus when running as part of the monorepo
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from core.redis_bus import redis_bus

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("EmailRouter")

app = FastAPI(title="Vector Email Connector Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gmail = GmailProvider()
outlook = OutlookProvider()
privacy = PrivacyLayer()

@app.on_event("startup")
async def startup_event():
    await redis_bus.connect()

@app.get("/auth/{provider}")
async def auth_redirect(provider: str, code: str, user_id: str = "user_1"):
    """
    Mock OAuth callback endpoint.
    """
    if provider == "gmail":
        token = gmail.authenticate(code)
    elif provider == "outlook":
        token = outlook.authenticate(code)
    else:
        return {"error": "Unknown provider"}
    
    token.user_id = user_id
    oauth_manager.save_token(user_id, token)
    return {"status": "success", "provider": provider}

@app.get("/status")
async def get_status(user_id: str = "user_1"):
    return {
        "gmail_connected": oauth_manager.is_connected(user_id, "gmail"),
        "outlook_connected": oauth_manager.is_connected(user_id, "outlook")
    }

@app.post("/webhook/{provider}")
async def receive_webhook(provider: str, request: Request, background_tasks: BackgroundTasks):
    """
    Receives push notifications from Gmail Pub/Sub or MS Graph Webhooks.
    For this MVP, it acts as an endpoint we can hit to simulate a pushed email.
    """
    data = await request.json()
    
    email = NormalizedEmail(
        subject=data.get("subject", "No Subject"),
        body=data.get("body", ""),
        sender=data.get("sender", "unknown@domain.com"),
        provider=provider
    )
    
    background_tasks.add_task(route_email, email)
    return {"status": "accepted"}

async def route_email(email: NormalizedEmail):
    logger.info(f"Routing email from {email.provider}: {email.subject}")
    
    # Step 1: Privacy layer stripping
    safe_body = privacy.strip_sensitive_content(email.body, strip_all=False)
    
    # Step 2 & 3 & 4 (via Redis architecture): Push to STREAM_RAW_EMAILS
    # The existing service_vector.py and service_orchestrator.py will process this seamlessly.
    raw_payload = {
        "subject": email.subject,
        "body": safe_body,
        "sender": email.sender
    }
    
    await redis_bus.publish("STREAM_RAW_EMAILS", raw_payload)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("email_router:app", host="0.0.0.0", port=8002, reload=False)
