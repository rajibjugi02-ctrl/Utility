import asyncio
from typing import Dict, List
from fastapi import WebSocket

class WebSocketProgressManager:
    def __init__(self):
        # Maps task_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)

    def disconnect(self, websocket: WebSocket, task_id: str):
        if task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def broadcast_progress(self, task_id: str, data: dict):
        if task_id in self.active_connections:
            sockets = list(self.active_connections[task_id])
            for ws in sockets:
                try:
                    await ws.send_json(data)
                except Exception:
                    self.disconnect(ws, task_id)

    def push_progress_sync(self, task_id: str, data: dict):
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast_progress(task_id, data), self.loop)

progress_manager = WebSocketProgressManager()
