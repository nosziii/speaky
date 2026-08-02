from uuid import uuid4
from fastapi import HTTPException
from .database import connection
from .security import hash_password

def family_for_user(user_id: str) -> dict | None:
    with connection() as db:
        family = db.execute("""SELECT h.*, hm.is_admin FROM households h
          JOIN household_members hm ON hm.household_id=h.id WHERE hm.user_id=%s ORDER BY hm.created_at LIMIT 1""", (user_id,)).fetchone()
        if not family: return None
        members = db.execute("""SELECT u.id,u.username,u.name,u.role,hm.is_admin FROM users u
          JOIN household_members hm ON hm.user_id=u.id WHERE hm.household_id=%s ORDER BY u.role DESC,u.name""", (family["id"],)).fetchall()
    return {**family, "members": members}

def require_family_admin(user: dict) -> dict:
    family = family_for_user(user["id"])
    if user["role"] != "parent" or not family or not family["is_admin"]:
        raise HTTPException(403, "Csak a családi admin kezelheti a fiókokat")
    return family

def create_family_account(admin: dict, username: str, name: str, password: str, role: str) -> dict:
    family = require_family_admin(admin)
    user_id = str(uuid4())
    try:
        with connection() as db:
            user = db.execute("""INSERT INTO users(id,username,name,role,password_hash)
              VALUES(%s,%s,%s,%s,%s) RETURNING id,username,name,role""",
              (user_id, username.lower().strip(), name.strip(), role, hash_password(password))).fetchone()
            db.execute("INSERT INTO household_members(household_id,user_id,is_admin) VALUES(%s,%s,FALSE)", (family["id"], user_id))
            conversation = db.execute("SELECT id FROM conversations WHERE household_id=%s AND kind='family'", (family["id"],)).fetchone()
            db.execute("INSERT INTO conversation_members(conversation_id,user_id) VALUES(%s,%s)", (conversation["id"], user_id))
        return user
    except Exception as error:
        if "unique" in str(error).lower(): raise HTTPException(409, "Ez a felhasználónév már foglalt")
        raise

def set_child_chat(admin: dict, enabled: bool) -> None:
    family = require_family_admin(admin)
    with connection() as db:
        db.execute("UPDATE households SET allow_child_chat=%s WHERE id=%s", (enabled, family["id"]))
