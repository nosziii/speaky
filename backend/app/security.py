from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
dummy_hash = hasher.hash("not-a-real-user-password")

def hash_password(password: str) -> str:
    return hasher.hash(password)

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        return hasher.verify(stored_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def verify_dummy(password: str) -> None:
    verify_password(dummy_hash, password)
