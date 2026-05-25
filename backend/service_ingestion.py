import asyncio
import logging
import random
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from core.redis_bus import redis_bus

from services.email_connector.providers import GmailProvider, OutlookProvider, GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID
from services.email_connector.oauth_manager import oauth_manager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Ingestion")

app = FastAPI(title="Vector Ingestion Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RawEmail(BaseModel):
    subject: str
    body: str
    sender: str

simulation_task = None
gmail = GmailProvider()
outlook = OutlookProvider()

async def email_polling_worker():
    logger.info("Email polling background worker started.")
    await asyncio.sleep(5)  # Let startup complete
    while True:
        try:
            # We iterate through all users who have active tokens
            for key, token_data in list(oauth_manager._tokens.items()):
                user_id = token_data.user_id
                provider = token_data.provider
                
                # Check if it's a mock token
                if token_data.access_token.startswith("mock_"):
                    # For mock tokens, periodically generate a mock email to show the system works!
                    # 20% chance every 10 seconds to generate a new mock email alert.
                    if random.random() < 0.2:
                        logger.info(f"Generating mock email alert for user {user_id} via {provider}")
                        
                        mock_subjects = [
                            "CRITICAL: CPU usage at 98% in production-eu-west-1",
                            "Security Alert: Unusual sign-in attempt from new device",
                            "Customer escalation: API response timeout on checkout endpoint",
                            "DB Warning: Connection pool capacity reached",
                        ]
                        mock_senders = [
                            "alerts@monitoring.cloud",
                            "security@enterprise-sec.com",
                            "support@vip-client.com",
                            "db-admin@postgres-cluster.local"
                        ]
                        mock_previews = [
                            "Average CPU utilization exceeded 95% on host-82fd. Triggering auto-scaling.",
                            "Sign-in request detected from IP 185.220.101.4 (Tor exit node) for user admin@company.com.",
                            "Payment processing delayed by 12.4s. Customer cart transaction ID: txn_981248a.",
                            "Active connections: 498/500. Escalating connection pool depletion.",
                        ]
                        
                        subject = random.choice(mock_subjects)
                        sender = random.choice(mock_senders)
                        preview = random.choice(mock_previews)
                        
                        # Trigger VECTOR_EMAIL_ALERT directly to UI Event Stream
                        alert_id = str(uuid.uuid4())
                        ui_event = {
                            "event_type": "VECTOR_EMAIL_ALERT",
                            "payload": {
                                "id": alert_id,
                                "agent_type": "intake",
                                "priority": "high" if "security" in sender.lower() else ("urgent" if "critical" in subject.lower() else "medium"),
                                "message": f"New email from {sender}: {subject}",
                                "subject": subject,
                                "from": sender,
                                "preview": preview,
                                "provider": provider
                            }
                        }
                        await redis_bus.publish("STREAM_UI_EVENTS", ui_event)
                        
                        # Also publish to RAW_EMAILS so it flows through the vector engine & logs in dashboard
                        raw_payload = {
                            "subject": subject,
                            "body": preview,
                            "sender": sender
                        }
                        await redis_bus.publish("STREAM_RAW_EMAILS", raw_payload)
                else:
                    # Real polling for Gmail / Outlook
                    if provider == "gmail":
                        emails = await gmail.fetch_new_emails(user_id)
                    elif provider == "outlook":
                        emails = await outlook.fetch_new_emails(user_id)
                    else:
                        emails = []
                        
                    for email in emails:
                        # 1. Publish raw email to vector stream so it triages
                        raw_payload = {
                            "subject": email.subject,
                            "body": email.body,
                            "sender": email.sender
                        }
                        await redis_bus.publish("STREAM_RAW_EMAILS", raw_payload)
                        
                        # 2. Trigger direct VECTOR_EMAIL_ALERT event
                        alert_id = str(uuid.uuid4())
                        ui_event = {
                            "event_type": "VECTOR_EMAIL_ALERT",
                            "payload": {
                                "id": alert_id,
                                "agent_type": "intake",
                                "priority": "high",
                                "message": f"New Email: {email.subject}",
                                "subject": email.subject,
                                "from": email.sender,
                                "preview": email.body[:100],
                                "provider": provider
                            }
                        }
                        await redis_bus.publish("STREAM_UI_EVENTS", ui_event)
                        
        except Exception as e:
            logger.error(f"Error in email polling worker: {e}")
            
        await asyncio.sleep(10)  # check every 10 seconds

async def run_demo_sequence():
    logger.info("Running deterministic demo sequence...")
    
    # 1. Security Drone spots issue
    await asyncio.sleep(1)
    await redis_bus.publish("STREAM_UI_EVENTS", {
        "event_type": "agent_action",
        "payload": {
            "id": str(uuid.uuid4()),
            "agent_type": "security",
            "priority": "high",
            "message": "Unusual error rate detected in Production DB",
            "summary": "Scanning production logs...",
            "confidence_score": 0.85
        }
    })

    # 2. Intake receives actual PagerDuty alert
    await asyncio.sleep(2)
    await redis_bus.publish("STREAM_UI_EVENTS", {
        "event_type": "agent_action",
        "payload": {
            "id": str(uuid.uuid4()),
            "agent_type": "intake",
            "priority": "urgent",
            "message": "PagerDuty: Production DB Latency Spike",
            "summary": "New incident reported",
            "recommended_action": "Escalate to DevOps",
            "confidence_score": 0.99
        }
    })
    
    # 3. Fighter Jet Escalation
    await asyncio.sleep(1.5)
    await redis_bus.publish("STREAM_UI_EVENTS", {
        "event_type": "agent_action",
        "payload": {
            "id": str(uuid.uuid4()),
            "agent_type": "escalation",
            "priority": "urgent",
            "message": "Critical Escalation Triggered",
            "summary": "Auto-creating Jira Ticket & Teams Alert",
            "recommended_action": "Awaiting Engineer Acknowledgment",
            "confidence_score": 0.95
        }
    })
    
    # 4. Routing to scheduling for post-mortem
    await asyncio.sleep(3)
    await redis_bus.publish("STREAM_UI_EVENTS", {
        "event_type": "agent_action",
        "payload": {
            "id": str(uuid.uuid4()),
            "agent_type": "scheduling",
            "priority": "medium",
            "message": "Scheduling Post-Mortem Meeting",
            "summary": "Finding available slot for DevOps team tomorrow",
            "confidence_score": 0.90
        }
    })

@app.on_event("startup")
async def startup_event():
    await redis_bus.connect()
    asyncio.create_task(email_polling_worker())

@app.post("/ingest")
async def ingest_email(email: RawEmail):
    logger.info(f"Ingesting email: {email.subject}")
    await redis_bus.publish("STREAM_RAW_EMAILS", email.model_dump())
    return {"status": "Ingested successfully", "subject": email.subject}

@app.post("/api/demo/start")
async def start_demo():
    asyncio.create_task(run_demo_sequence())
    return {"status": "Demo started"}

@app.post("/simulate/live/start")
async def start_live_simulation():
    global simulation_task
    if simulation_task is None or simulation_task.done():
        simulation_task = asyncio.create_task(run_live_simulation())
        return {"status": "Live simulation started"}
    return {"status": "Live simulation already running"}

@app.post("/simulate/live/stop")
async def stop_live_simulation():
    global simulation_task
    if simulation_task and not simulation_task.done():
        simulation_task.cancel()
        return {"status": "Live simulation stopped"}
    return {"status": "Live simulation is not running"}

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ingestion",
        "redis_connected": redis_bus.is_connected
    }

@app.get("/auth/google/login")
async def google_login(user_id: str = "user_1"):
    if not GOOGLE_CLIENT_ID:
        # Mock login flow: redirect directly to callback
        logger.info("No GOOGLE_CLIENT_ID found, redirecting to mock callback")
        return RedirectResponse(url=f"/auth/google/callback?code=mock_google_code_{int(time.time() if 'time' in globals() else asyncio.get_event_loop().time())}&state={user_id}")
    
    redirect_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:8000/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&access_type=offline&state={user_id}&prompt=consent"
    return RedirectResponse(url=redirect_url)

@app.get("/auth/google/callback")
async def google_callback(code: str, state: str = "user_1"):
    token = await gmail.authenticate(code, state)
    oauth_manager.save_token(state, token)
    return RedirectResponse(url="http://localhost:3000/connect-inbox")

@app.get("/auth/microsoft/login")
async def microsoft_login(user_id: str = "user_1"):
    if not MICROSOFT_CLIENT_ID:
        # Mock login flow: redirect directly to callback
        logger.info("No MICROSOFT_CLIENT_ID found, redirecting to mock callback")
        return RedirectResponse(url=f"/auth/microsoft/callback?code=mock_outlook_code_{int(time.time() if 'time' in globals() else asyncio.get_event_loop().time())}&state={user_id}")
    
    redirect_url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=http://localhost:8000/auth/microsoft/callback&response_mode=query&scope=https://graph.microsoft.com/Mail.Read offline_access&state={user_id}"
    return RedirectResponse(url=redirect_url)

@app.get("/auth/microsoft/callback")
async def microsoft_callback(code: str, state: str = "user_1"):
    token = await outlook.authenticate(code, state)
    oauth_manager.save_token(state, token)
    return RedirectResponse(url="http://localhost:3000/connect-inbox")

@app.get("/status")
async def get_status(user_id: str = "user_1"):
    return {
        "gmail_connected": oauth_manager.is_connected(user_id, "gmail"),
        "outlook_connected": oauth_manager.is_connected(user_id, "outlook")
    }

@app.get("/auth/{provider}")
async def auth_redirect_legacy(provider: str, code: str, user_id: str = "user_1"):
    if provider == "gmail":
        token = await gmail.authenticate(code, user_id)
    elif provider == "outlook":
        token = await outlook.authenticate(code, user_id)
    else:
        return {"error": "Unknown provider"}
    
    oauth_manager.save_token(user_id, token)
    return {"status": "success", "provider": provider}

async def run_live_simulation():
    mock_sequence = [
        {"subject": "Weekly Newsletter", "body": "Here are the updates for this week.", "sender": "internal@company.com", "delay": 2.0},
        {"subject": "Security Breach detected", "body": "Multiple failed logins from unknown IP", "sender": "soc@company.com", "delay": 4.0},
        {"subject": "Urgent: Production DB Down", "body": "Latency is spiking...", "sender": "pagerduty@company.com", "delay": 5.0},
    ]
    
    try:
        while True:
            for item in mock_sequence:
                await asyncio.sleep(item["delay"])
                email = {
                    "subject": item["subject"],
                    "body": item["body"],
                    "sender": item["sender"]
                }
                logger.info(f"Simulating email: {email['subject']}")
                await redis_bus.publish("STREAM_RAW_EMAILS", email)
                
            await asyncio.sleep(8.0)
    except asyncio.CancelledError:
        logger.info("Simulation task cancelled")

if __name__ == "__main__":
    import uvicorn
    import time
    uvicorn.run("service_ingestion:app", host="0.0.0.0", port=8000, reload=False)
