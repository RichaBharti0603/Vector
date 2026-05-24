import asyncio
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.redis_bus import redis_bus

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Gateway")

app = FastAPI(title="Vector Gateway Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket connection.")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("WebSocket disconnected.")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WS: {e}")

manager = ConnectionManager()

async def consume_ui_events():
    # Consume from STREAM_UI_EVENTS
    async for payload, msg_id in redis_bus.consume_stream("STREAM_UI_EVENTS", "gateway_group", "gateway_worker_1"):
        logger.info(f"Gateway sending UI event: {payload.get('event_type')}")
        await manager.broadcast(json.dumps(payload))

@app.on_event("startup")
async def startup_event():
    await redis_bus.connect()
    asyncio.create_task(consume_ui_events())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("service_gateway:app", host="0.0.0.0", port=8001, reload=False)
