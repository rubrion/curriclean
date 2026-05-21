#!/bin/sh
set -e
echo "BOOT-A: starting alembic"
alembic upgrade head
echo "BOOT-B: alembic done, starting uvicorn on port 8000"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug
