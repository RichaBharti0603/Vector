import asyncio
import logging
import random
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from core.redis_bus import redis_bus

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

@app.on_event("startup")
async def startup_event():
    await redis_bus.connect()

@app.post("/ingest")
async def ingest_email(email: RawEmail):
    logger.info(f"Ingesting email: {email.subject}")
    await redis_bus.publish("STREAM_RAW_EMAILS", email.model_dump())
    return {"status": "Ingested successfully", "subject": email.subject}

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
        "status": "healthy",
        "service": "ingestion",
        "redis_connected": redis_bus.is_connected
    }

async def run_live_simulation():
    # Deterministic sequence that tells a story:
    # 1. Routine
    # 2. High Priority (Security)
    # 3. Urgent (DB Down - Escalation)
    mock_sequence = [
        {"subject": "Weekly Newsletter", "body": "Here are the updates for this week.", "sender": "internal@company.com", "delay": 2.0},
        {"subject": "Security Breach detected", "body": "Multiple failed logins from unknown IP", "sender": "soc@company.com", "delay": 4.0},
        {"subject": "Urgent: Production DB Down", "body": "Latency is spiking...", "sender": "pagerduty@company.com", "delay": 5.0},
    ]
    
    try:
        # We loop the sequence
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
                
            # Add a longer pause before restarting sequence
            await asyncio.sleep(8.0)
    except asyncio.CancelledError:
        logger.info("Simulation task cancelled")

if __name__ == "__main__":
    import uvicorn
    # Gateway is on 8001, so Ingestion will be on 8000
    uvicorn.run("service_ingestion:app", host="0.0.0.0", port=8000, reload=False)

