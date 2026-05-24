import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.event_bus import event_bus
from core.models import EventPayload, Priority, AgentType
import uuid

app = FastAPI(title="AI ATC Orchestrator")

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

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Background task to listen to event bus and broadcast via WebSockets
async def websocket_broadcaster():
    queue = asyncio.Queue()
    event_bus.subscribe_queue(queue)
    try:
        while True:
            event = await queue.get()
            # event is dict {"type": str, "data": BaseModel or dict}
            data = event["data"]
            if hasattr(data, "model_dump"):
                data_dict = data.model_dump()
            else:
                data_dict = data
                
            msg = {
                "event_type": event["type"],
                "payload": data_dict
            }
            await manager.broadcast(json.dumps(msg))
    except asyncio.CancelledError:
        event_bus.unsubscribe_queue(queue)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(websocket_broadcaster())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from UI if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/trigger/demo")
async def trigger_demo():
    """Trigger the production outage demo scenario"""
    asyncio.create_task(run_demo_scenario())
    return {"status": "Demo started"}

async def run_demo_scenario():
    # 1. Security Drone spots issue
    await asyncio.sleep(1)
    await event_bus.publish("agent_action", EventPayload(
        id=str(uuid.uuid4()),
        agent_type=AgentType.SECURITY,
        priority=Priority.HIGH,
        message="Unusual error rate detected in Production DB",
        summary="Scanning production logs...",
        confidence_score=0.85
    ))

    # 2. Intake receives actual PagerDuty alert
    await asyncio.sleep(2)
    await event_bus.publish("agent_action", EventPayload(
        id=str(uuid.uuid4()),
        agent_type=AgentType.INTAKE,
        priority=Priority.URGENT,
        message="PagerDuty: Production DB Latency Spike",
        summary="New incident reported",
        recommended_action="Escalate to DevOps",
        confidence_score=0.99
    ))
    
    # 3. Fighter Jet Escalation
    await asyncio.sleep(1.5)
    await event_bus.publish("agent_action", EventPayload(
        id=str(uuid.uuid4()),
        agent_type=AgentType.ESCALATION,
        priority=Priority.URGENT,
        message="Critical Escalation Triggered",
        summary="Auto-creating Jira Ticket & Teams Alert",
        recommended_action="Awaiting Engineer Acknowledgment",
        confidence_score=0.95
    ))
    
    # 4. Routing to scheduling for post-mortem
    await asyncio.sleep(3)
    await event_bus.publish("agent_action", EventPayload(
        id=str(uuid.uuid4()),
        agent_type=AgentType.SCHEDULING,
        priority=Priority.MEDIUM,
        message="Scheduling Post-Mortem Meeting",
        summary="Finding available slot for DevOps team tomorrow",
        confidence_score=0.90
    ))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
