import asyncio
import logging
from core.redis_bus import redis_bus
from core.vector_engine import VectorTriageEngine

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VectorService")

engine = VectorTriageEngine()

async def process_emails():
    logger.info("Vector Engine Worker Started. Waiting for emails...")
    await redis_bus.connect()
    
    async for payload, msg_id in redis_bus.consume_stream("STREAM_RAW_EMAILS", "vector_group", "vector_worker_1"):
        logger.info(f"Vector Engine processing email: {payload.get('subject')}")
        
        # Inference
        event_type, decision_payload = engine.process_email(payload)
        
        # Serialize to dict explicitly since we need to send via JSON
        if hasattr(decision_payload, "model_dump"):
            decision_dict = decision_payload.model_dump()
        else:
            decision_dict = decision_payload
            
        # Add event_type into the payload dict for the orchestrator to know what it is
        decision_dict["_internal_event_type"] = event_type
        
        # Publish to next queue
        await redis_bus.publish("STREAM_DECISIONS", decision_dict)

if __name__ == "__main__":
    try:
        asyncio.run(process_emails())
    except KeyboardInterrupt:
        logger.info("Vector Service stopped.")
