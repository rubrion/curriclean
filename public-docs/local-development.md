# Local Development

## Backend

```bash
cd backend
uv venv --python 3.12 && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env   # fill in secrets
alembic upgrade head
uvicorn app.main:app --reload
```

Seed demo data (optional):

```bash
python -m scripts.seed --reset
```

## Frontend

```bash
cd web-client
npm install
cp .env.example .env.local   # fill in secrets
npm run dev
```
