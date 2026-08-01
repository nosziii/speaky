from app.main import clean
from app.security import hash_password, verify_password

def test_argon2_password_hash_is_not_plaintext():
    password = "egy-nagyon-eros-jelszo"
    stored = hash_password(password)
    assert stored != password
    assert stored.startswith("$argon2id$")
    assert verify_password(stored, password)
    assert not verify_password(stored, "hibas-jelszo")

def test_message_cleaning():
    assert clean("  szia   apa  ") == "szia apa"
