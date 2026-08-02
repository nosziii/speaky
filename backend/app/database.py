import time
from psycopg import connect
from psycopg.rows import dict_row
from .config import settings
from .security import hash_password

USERS_SCHEMA = """CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  password_hash TEXT NOT NULL,
  password_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)"""

MESSAGES_SCHEMA = """CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('text', 'speech')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)"""

FAMILY_SCHEMAS = [
    """CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      allow_child_chat BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS household_members (
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (household_id, user_id)
    )""",
    """CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('family', 'direct')),
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      title TEXT, created_by TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (conversation_id, user_id)
    )""",
]

def connection():
    return connect(settings.database_url, row_factory=dict_row)

def initialize(attempts: int = 20) -> None:
    for attempt in range(attempts):
        try:
            with connection() as db:
                db.execute(USERS_SCHEMA)
                db.execute(MESSAGES_SCHEMA)
                for schema in FAMILY_SCHEMAS: db.execute(schema)
                db.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT")
                db.execute("CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC)")
                db.execute(
                    "INSERT INTO users(id, username, name, role, password_hash) VALUES(%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                    ("parent", settings.parent_username.lower(), "Apa", "parent", hash_password(settings.parent_password)),
                )
                db.execute(
                    "INSERT INTO users(id, username, name, role, password_hash) VALUES(%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                    ("child", settings.child_username.lower(), "Manó", "child", hash_password(settings.child_password)),
                )
                db.execute("INSERT INTO households(id,name) VALUES('family-default','A mi családunk') ON CONFLICT DO NOTHING")
                db.execute("INSERT INTO household_members(household_id,user_id,is_admin) VALUES('family-default','parent',TRUE),('family-default','child',FALSE) ON CONFLICT DO NOTHING")
                db.execute("INSERT INTO conversations(id,kind,household_id,title,created_by) VALUES('family-default','family','family-default','A mi családunk','parent') ON CONFLICT DO NOTHING")
                db.execute("INSERT INTO conversation_members(conversation_id,user_id) SELECT 'family-default',user_id FROM household_members WHERE household_id='family-default' ON CONFLICT DO NOTHING")
                db.execute("UPDATE messages SET conversation_id='family-default' WHERE conversation_id IS NULL")
                db.execute("CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, id DESC)")
            return
        except Exception:
            if attempt == attempts - 1: raise
            time.sleep(1)

def serialize(row: dict) -> dict:
    result = dict(row)
    result["created_at"] = result["created_at"].isoformat()
    return result

def history(limit: int = 200) -> list[dict]:
    with connection() as db:
        rows = db.execute(
            "SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT %s) recent ORDER BY id",
            (limit,),
        ).fetchall()
    return [serialize(row) for row in rows]

def save_message(sender_id: str, sender_name: str, kind: str, text: str) -> dict:
    with connection() as db:
        row = db.execute(
            "INSERT INTO messages(sender_id, sender_name, kind, text) VALUES(%s,%s,%s,%s) RETURNING *",
            (sender_id, sender_name, kind, text),
        ).fetchone()
    return serialize(row)

def user_by_username(username: str) -> dict | None:
    with connection() as db:
        return db.execute("SELECT * FROM users WHERE username=%s", (username.lower().strip(),)).fetchone()

def user_by_id(user_id: str) -> dict | None:
    with connection() as db:
        return db.execute("SELECT * FROM users WHERE id=%s", (user_id,)).fetchone()

def update_password(user_id: str, password_hash: str) -> int:
    with connection() as db:
        row = db.execute(
            "UPDATE users SET password_hash=%s, password_version=password_version+1, updated_at=NOW() WHERE id=%s RETURNING password_version",
            (password_hash, user_id),
        ).fetchone()
    return row["password_version"]
