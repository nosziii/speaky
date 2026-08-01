from fastapi import WebSocket

class Connections:
    def __init__(self): self.clients: dict[WebSocket, str] = {}
    async def connect(self, socket: WebSocket, user_id: str): await socket.accept(); self.clients[socket] = user_id
    def disconnect(self, socket: WebSocket): self.clients.pop(socket, None)
    async def broadcast(self, payload: dict, except_user: str | None = None):
        stale = []
        for client, user_id in list(self.clients.items()):
            if user_id == except_user: continue
            try: await client.send_json(payload)
            except Exception: stale.append(client)
        for client in stale: self.disconnect(client)
    async def revoke_user(self, user_id: str):
        targets = [client for client, connected_user in self.clients.items() if connected_user == user_id]
        for client in targets:
            self.disconnect(client)
            try: await client.close(code=4401)
            except Exception: pass

connections = Connections()
