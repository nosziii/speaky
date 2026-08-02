import re
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from .auth import authenticate, make_token, public_user, require_user, websocket_user
from .config import settings
from .database import initialize, update_password
from .families import create_family_account, family_for_user, set_child_chat
from .chats import can_access, conversation_history, conversations_for, create_direct, recipient_ids, save_chat_message
from .realtime import connections
from .security import hash_password, verify_password

@asynccontextmanager
async def lifespan(_: FastAPI): initialize(); yield
app = FastAPI(title="Itt vagyok API", docs_url=None, redoc_url=None, lifespan=lifespan)

class Login(BaseModel): username: str = Field(max_length=80); password: str = Field(max_length=200)
class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=10, max_length=128)
class AccountCreate(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9._-]+$")
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=10, max_length=128)
    role: str = Field(pattern=r"^(parent|child)$")
class ChildChatSetting(BaseModel): enabled: bool
class DirectCreate(BaseModel): username: str = Field(min_length=3, max_length=40)

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

@app.get("/api/family")
def family(user: dict = Depends(require_user)):
    result = family_for_user(user["id"])
    if not result: raise HTTPException(404, "Nincs családi csoport")
    return result

@app.post("/api/family/accounts", status_code=201)
def add_account(body: AccountCreate, user: dict = Depends(require_user)):
    return create_family_account(user, body.username, body.name, body.password, body.role)

@app.patch("/api/family/child-chat", status_code=204)
def child_chat(body: ChildChatSetting, user: dict = Depends(require_user)):
    set_child_chat(user, body.enabled)

@app.get("/api/conversations")
def conversations(user: dict = Depends(require_user)): return conversations_for(user)

@app.post("/api/conversations/direct", status_code=201)
def direct(body: DirectCreate, user: dict = Depends(require_user)): return create_direct(user, body.username)

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
async def legacy_chat(socket: WebSocket):
    await socket.accept()
    await socket.close(code=4401)

@app.websocket("/ws/chat/{conversation_id}")
async def chat(socket: WebSocket, conversation_id: str):
    user = websocket_user(socket)
    if not user:
        await socket.accept()
        await socket.close(code=4401)
        return
    if not can_access(user["id"], conversation_id):
        await socket.accept(); await socket.close(code=4403); return
    await connections.connect(socket, user["id"], conversation_id)
    await socket.send_json({"type": "history", "messages": conversation_history(user, conversation_id)})
    try:
        while True:
            data = await socket.receive_json()
            recipients = recipient_ids(user, conversation_id)
            if data.get("type") == "signal":
                await connections.broadcast({"type": "signal", "from": user["name"]}, conversation_id, recipients, except_user=user["id"])
                continue
            text = clean(str(data.get("text", ""))); kind = data.get("kind", "text")
            if text and kind in {"text", "speech"}:
                message = save_chat_message(user, conversation_id, kind, text)
                await connections.broadcast({"type": "message", "message": message}, conversation_id, recipients)
    except WebSocketDisconnect: connections.disconnect(socket)
