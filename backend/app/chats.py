from uuid import uuid4
from fastapi import HTTPException
from .database import connection, serialize

def conversations_for(user: dict) -> list[dict]:
    with connection() as db:
        rows = db.execute("""SELECT c.id,c.kind,c.household_id,
          CASE WHEN c.kind='family' THEN c.title ELSE COALESCE(other.name,'Beszélgetés') END AS title
          FROM conversations c JOIN conversation_members mine ON mine.conversation_id=c.id AND mine.user_id=%s
          LEFT JOIN conversation_members other_member ON c.kind='direct' AND other_member.conversation_id=c.id AND other_member.user_id<>%s
          LEFT JOIN users other ON other.id=other_member.user_id
          ORDER BY c.kind ASC,c.created_at""", (user["id"], user["id"])).fetchall()
    return rows

def create_direct(user: dict, username: str) -> dict:
    if user["role"] != "parent": raise HTTPException(403, "Gyermek nem indíthat külső beszélgetést")
    with connection() as db:
        target = db.execute("SELECT id,name,role FROM users WHERE username=%s", (username.lower().strip(),)).fetchone()
        if not target or target["role"] != "parent": raise HTTPException(404, "Nem található ilyen szülői fiók")
        if target["id"] == user["id"]: raise HTTPException(400, "Saját magaddal nem indíthatsz beszélgetést")
        existing = db.execute("""SELECT c.id,c.kind,%s AS title FROM conversations c
          JOIN conversation_members a ON a.conversation_id=c.id AND a.user_id=%s
          JOIN conversation_members b ON b.conversation_id=c.id AND b.user_id=%s
          WHERE c.kind='direct' LIMIT 1""", (target["name"], user["id"], target["id"])).fetchone()
        if existing: return existing
        conversation_id = str(uuid4())
        db.execute("INSERT INTO conversations(id,kind,created_by) VALUES(%s,'direct',%s)", (conversation_id, user["id"]))
        db.execute("INSERT INTO conversation_members(conversation_id,user_id) VALUES(%s,%s),(%s,%s)", (conversation_id,user["id"],conversation_id,target["id"]))
    return {"id": conversation_id, "kind": "direct", "title": target["name"], "household_id": None}

def can_access(user_id: str, conversation_id: str) -> bool:
    with connection() as db:
        return db.execute("SELECT 1 FROM conversation_members WHERE conversation_id=%s AND user_id=%s", (conversation_id,user_id)).fetchone() is not None

def conversation_history(user: dict, conversation_id: str, limit: int = 200) -> list[dict]:
    if not can_access(user["id"], conversation_id): raise HTTPException(403, "Nincs hozzáférésed ehhez a beszélgetéshez")
    with connection() as db:
        conversation = db.execute("SELECT kind,household_id FROM conversations WHERE id=%s", (conversation_id,)).fetchone()
        child_filter = ""
        params: list = [conversation_id]
        if user["role"] == "child" and conversation["kind"] == "family":
            family = db.execute("SELECT allow_child_chat FROM households WHERE id=%s", (conversation["household_id"],)).fetchone()
            if not family["allow_child_chat"]:
                child_filter = " AND (sender_id=%s OR sender_id IN (SELECT id FROM users WHERE role='parent'))"
                params.append(user["id"])
        params.append(limit)
        rows = db.execute(f"SELECT * FROM (SELECT * FROM messages WHERE conversation_id=%s{child_filter} ORDER BY id DESC LIMIT %s) recent ORDER BY id", params).fetchall()
    return [serialize(row) for row in rows]

def save_chat_message(user: dict, conversation_id: str, kind: str, text: str) -> dict:
    if not can_access(user["id"], conversation_id): raise HTTPException(403, "Nincs hozzáférésed ehhez a beszélgetéshez")
    with connection() as db:
        row = db.execute("""INSERT INTO messages(sender_id,sender_name,kind,text,conversation_id)
          VALUES(%s,%s,%s,%s,%s) RETURNING *""", (user["id"],user["name"],kind,text,conversation_id)).fetchone()
    return serialize(row)

def recipient_ids(user: dict, conversation_id: str) -> set[str]:
    if not can_access(user["id"], conversation_id): return set()
    with connection() as db:
        conversation = db.execute("SELECT kind,household_id FROM conversations WHERE id=%s", (conversation_id,)).fetchone()
        if conversation["kind"] == "family" and user["role"] == "child":
            family = db.execute("SELECT allow_child_chat FROM households WHERE id=%s", (conversation["household_id"],)).fetchone()
            if not family["allow_child_chat"]:
                rows = db.execute("""SELECT cm.user_id FROM conversation_members cm JOIN users u ON u.id=cm.user_id
                  WHERE cm.conversation_id=%s AND (u.role='parent' OR u.id=%s)""", (conversation_id,user["id"])).fetchall()
                return {row["user_id"] for row in rows}
        rows = db.execute("SELECT user_id FROM conversation_members WHERE conversation_id=%s", (conversation_id,)).fetchall()
    return {row["user_id"] for row in rows}
