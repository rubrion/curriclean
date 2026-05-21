# SpecFit Backend

FastAPI service for the SpecFit job-application tracker.

## Stack

- Python 3.12, async FastAPI
- SQLModel + Alembic on PostgreSQL (JSONB for stored LLM analysis)
- `pydantic-ai` agent for structured LLM output, via OpenRouter (OpenAI-compatible)
- `logfire` instrumentation (FastAPI, SQLAlchemy, HTTPX, pydantic-ai)

## Local dev

```bash
cp .env.example .env
# fill OPENROUTER_API_KEY, set DATABASE_URL to your local Postgres

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Validation gate

```bash
ruff check app tests
ruff format --check app tests
pyright
pytest
```

## Railway

`DATABASE_URL` is injected by the Postgres plugin. Set `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL`, `LOGFIRE_TOKEN`, `CORS_ORIGINS`. Start command runs `alembic upgrade head` before serving.
