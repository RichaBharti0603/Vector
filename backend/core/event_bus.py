import asyncio
from typing import Callable, Dict, List, Set

class EventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}
        self.queues: Set[asyncio.Queue] = set()

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

    def subscribe_queue(self, queue: asyncio.Queue):
        self.queues.add(queue)

    def unsubscribe_queue(self, queue: asyncio.Queue):
        self.queues.discard(queue)

    async def publish(self, event_type: str, data: any):
        # Notify callback subscribers
        if event_type in self.subscribers:
            for callback in self.subscribers[event_type]:
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)
        
        # Notify queue subscribers (like websockets)
        for queue in list(self.queues):
            try:
                await queue.put({"type": event_type, "data": data})
            except Exception as e:
                print(f"Error publishing to queue: {e}")

event_bus = EventBus()
