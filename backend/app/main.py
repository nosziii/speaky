import re
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from .auth import authenticate, make_token, public_user, require_user, websocket_user
from .config import settings
from .database import history, initialize, save_message, update_password
from .realtime import connections
from .security import hash_password, verify_password

@asynccontextmanager
async def lifespan(_: FastAPI): initialize(); yield
app = FastAPI(title="Itt vagyok API", docs_url=None, redoc_url=None, lifespan=lifespan)

class Login(BaseModel): username: str = Field(max_length=80); password: str = Field(max_length=200)
class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=10, max_length=128)

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.post("/api/login")
def login(body: Login, response: Response):
    user = authenticate(body.username, body.password)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(401, "Hibás belépési adatok")
    response.set_cookie("speaky_session", make_token(user), max_age=2592000, httponly=True, samesite="strict", secure=settings.secure_cookie)
    return public_user(user)

@app.post("/api/logout", status_code=204)
def logout(response: Response): response.delete_cookie("speaky_session")

@app.get("/api/me")
def me(user: dict = Depends(require_user)): return public_user(user)

@app.post("/api/password")
async def change_password(body: PasswordChange, response: Response, user: dict = Depends(require_user)):
    if not verify_password(user["password_hash"], body.current_password):
        raise HTTPException(400, "A jelenlegi jelszó nem megfelelő")
    if body.current_password == body.new_password:
        raise HTTPException(400, "Az új jelszó legyen más, mint a jelenlegi")
    version = update_password(user["id"], hash_password(body.new_password))
    updated = {**user, "password_version": version}
    response.set_cookie("speaky_session", make_token(updated), max_age=2592000, httponly=True, samesite="strict", secure=settings.secure_cookie)
    await connections.revoke_user(user["id"])
    return {"message": "A jelszó megváltozott"}

def clean(text: str) -> str: return re.sub(r"\s+", " ", text).strip()[:2000]

@app.websocket("/ws/chat")
async def chat(socket: WebSocket):
    user = websocket_user(socket)
    if not user:
        await socket.accept()
        await socket.close(code=4401)
        return
    await connections.connect(socket, user["id"])
    await socket.send_json({"type": "history", "messages": history()})
    try:
        while True:
            data = await socket.receive_json()
            if data.get("type") == "signal":
                await connections.broadcast({"type": "signal", "from": user["name"]}, except_user=user["id"])
                continue
            text = clean(str(data.get("text", ""))); kind = data.get("kind", "text")
            if text and kind in {"text", "speech"}:
                message = save_message(user["id"], user["name"], kind, text)
                await connections.broadcast({"type": "message", "message": message})
    except WebSocketDisconnect: connections.disconnect(socket)
