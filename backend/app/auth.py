from fastapi import HTTPException, Request, WebSocket
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from .config import settings
from .database import user_by_id, user_by_username
from .security import verify_dummy, verify_password

serializer = URLSafeTimedSerializer(settings.session_secret, salt="speaky-session")

def public_user(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "role": user["role"]}

def authenticate(username: str, password: str) -> dict | None:
    user = user_by_username(username)
    if not user:
        verify_dummy(password)
        return None
    return user if verify_password(user["password_hash"], password) else None

def make_token(user: dict) -> str:
    return serializer.dumps({"id": user["id"], "version": user["password_version"]})

def read_token(token: str | None) -> dict | None:
    if not token: return None
    try:
        session = serializer.loads(token, max_age=60 * 60 * 24 * 30)
        user = user_by_id(session.get("id", ""))
        if not user or user["password_version"] != session.get("version"): return None
        return user
    except (BadSignature, SignatureExpired):
        return None

def require_user(request: Request) -> dict:
    user = read_token(request.cookies.get("speaky_session"))
    if not user: raise HTTPException(401, "Bejelentkezés szükséges")
    return user

def websocket_user(websocket: WebSocket) -> dict | None:
    return read_token(websocket.cookies.get("speaky_session"))
