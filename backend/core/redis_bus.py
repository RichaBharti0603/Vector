import asyncio
import json
import logging
from typing import Dict, Any, AsyncGenerator
import redis.asyncio as redis

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RedisBus")

class RedisBus:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.client = None

    async def connect(self):
        if not self.client:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            logger.info("Connected to Redis Event Bus.")

    async def publish(self, stream_name: str, payload: dict):
        if not self.client:
            await self.connect()
        try:
            # We encode payload as JSON string inside the stream field "data"
            await self.client.xadd(stream_name, {"data": json.dumps(payload)})
            logger.info(f"Published to stream: {stream_name}")
        except Exception as e:
            logger.error(f"Failed to publish to {stream_name}: {e}")

    async def consume_stream(self, stream_name: str, consumer_group: str, consumer_name: str) -> AsyncGenerator[Dict[str, Any], None]:
        if not self.client:
            await self.connect()
            
        # Ensure group exists
        try:
            await self.client.xgroup_create(stream_name, consumer_group, mkstream=True)
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                logger.error(f"Error creating consumer group: {e}")

        last_id = ">"
        while True:
            try:
                # Read from stream, block for up to 1000ms
                messages = await self.client.xreadgroup(
                    consumer_group,
                    consumer_name,
                    {stream_name: last_id},
                    count=10,
                    block=1000
                )
                
                for stream, msg_list in messages:
                    for msg_id, msg_data in msg_list:
                        raw_data = msg_data.get("data")
                        if raw_data:
                            payload = json.loads(raw_data)
                            yield payload, msg_id
                            
                        # Ack message
                        await self.client.xack(stream_name, consumer_group, msg_id)
            except asyncio.CancelledError:
                logger.info(f"Stopped consuming stream {stream_name}")
                break
            except Exception as e:
                logger.error(f"Error consuming stream {stream_name}: {e}")
                await asyncio.sleep(1)

redis_bus = RedisBus()
