import asyncio
import json
import logging
from typing import Dict, Any, AsyncGenerator
import redis.asyncio as redis
from redis.exceptions import ConnectionError, TimeoutError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RedisBus")

class RedisBus:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.client = None
        self.is_connected = False
        self.fallback_buffer = []  # Buffer for when Redis is down
        self.MAX_BUFFER_SIZE = 1000

    async def connect(self):
        if not self.client:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            try:
                await self.client.ping()
                self.is_connected = True
                logger.info("Connected to Redis Event Bus.")
                await self._flush_buffer()
            except (ConnectionError, TimeoutError):
                self.is_connected = False
                logger.warning("Redis is unavailable. Running in degraded mode with fallback buffering.")

    async def _flush_buffer(self):
        if self.is_connected and self.fallback_buffer:
            logger.info(f"Flushing {len(self.fallback_buffer)} buffered messages to Redis...")
            # We copy and clear buffer to avoid race conditions during flush
            messages_to_flush = list(self.fallback_buffer)
            self.fallback_buffer.clear()
            for stream_name, payload in messages_to_flush:
                await self.publish(stream_name, payload)

    async def publish(self, stream_name: str, payload: dict):
        if not self.client or not self.is_connected:
            await self.connect()
            
        if self.is_connected:
            try:
                await self.client.xadd(stream_name, {"data": json.dumps(payload)})
                logger.info(f"Published to stream: {stream_name}")
            except (ConnectionError, TimeoutError):
                self.is_connected = False
                logger.error(f"Redis connection lost during publish. Buffering message for {stream_name}.")
                self._buffer_message(stream_name, payload)
            except Exception as e:
                logger.error(f"Failed to publish to {stream_name}: {e}")
        else:
            self._buffer_message(stream_name, payload)
            
    def _buffer_message(self, stream_name: str, payload: dict):
        if len(self.fallback_buffer) < self.MAX_BUFFER_SIZE:
            self.fallback_buffer.append((stream_name, payload))
        else:
            logger.error("Fallback buffer is full. Dropping message.")

    async def consume_stream(self, stream_name: str, consumer_group: str, consumer_name: str) -> AsyncGenerator[Dict[str, Any], None]:
        while True:
            if not self.client or not self.is_connected:
                await self.connect()
                if not self.is_connected:
                    await asyncio.sleep(5)
                    continue

            # Ensure group exists
            try:
                await self.client.xgroup_create(stream_name, consumer_group, mkstream=True)
            except redis.exceptions.ResponseError as e:
                if "BUSYGROUP" not in str(e):
                    logger.error(f"Error creating consumer group: {e}")
            except (ConnectionError, TimeoutError):
                self.is_connected = False
                continue

            last_id = ">"
            try:
                while True:
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
            except (ConnectionError, TimeoutError):
                self.is_connected = False
                logger.warning("Redis connection lost during consumption. Reconnecting...")
                await asyncio.sleep(2)
            except asyncio.CancelledError:
                logger.info(f"Stopped consuming stream {stream_name}")
                break
            except Exception as e:
                logger.error(f"Error consuming stream {stream_name}: {e}")
                await asyncio.sleep(1)

redis_bus = RedisBus()
