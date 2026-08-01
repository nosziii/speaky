import asyncio
import json
import httpx
import websockets

async def login(username: str, password: str) -> str:
    async with httpx.AsyncClient(base_url="http://gateway") as client:
        response = await client.post("/api/login", json={"username": username, "password": password})
        response.raise_for_status()
        return client.cookies.get("speaky_session")

async def main():
    parent, child = await asyncio.gather(login("apa", "apa1234"), login("mano", "mano1234"))
    async with websockets.connect("ws://gateway/ws/chat", additional_headers={"Cookie": f"speaky_session={parent}"}) as parent_socket, websockets.connect("ws://gateway/ws/chat", additional_headers={"Cookie": f"speaky_session={child}"}) as child_socket:
        await parent_socket.recv()
        await child_socket.recv()
        await parent_socket.send(json.dumps({"type": "signal"}))
        received = json.loads(await asyncio.wait_for(child_socket.recv(), timeout=2))
        assert received == {"type": "signal", "from": "Apa"}

if __name__ == "__main__":
    asyncio.run(main())
