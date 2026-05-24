import asyncio
import logging
from core.redis_bus import redis_bus

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Orchestrator")

async def process_decisions():
    logger.info("Orchestrator Worker Started. Waiting for Vector decisions...")
    await redis_bus.connect()
    
    async for payload, msg_id in redis_bus.consume_stream("STREAM_DECISIONS", "orchestrator_group", "orchestrator_worker_1"):
        event_type = payload.pop("_internal_event_type", "VECTOR_CLASSIFIED")
        
        logger.info(f"Orchestrator executing workflow for: {payload.get('summary')} (Priority: {payload.get('priority')})")
        
        # Here we would normally have logic to hit external APIs
        if payload.get("priority") == "urgent":
            logger.info("-> Mock: Triggering PagerDuty/Jira API for Escalation")
        elif payload.get("priority") == "high":
            logger.info("-> Mock: Sending Slack Alert for Security Event")
            
        # Re-pack and publish to the UI Event Stream for the Gateway to broadcast
        ui_event = {
            "event_type": event_type,
            "payload": payload
        }
        await redis_bus.publish("STREAM_UI_EVENTS", ui_event)

if __name__ == "__main__":
    try:
        asyncio.run(process_decisions())
    except KeyboardInterrupt:
        logger.info("Orchestrator Service stopped.")
