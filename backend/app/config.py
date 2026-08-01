from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    session_secret: str = "change-this-before-production"
    parent_username: str = "apa"
    parent_password: str = "apa1234"
    child_username: str = "mano"
    child_password: str = "mano1234"
    database_url: str = "postgresql://speaky:speaky@postgres:5432/speaky"
    secure_cookie: bool = False
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
