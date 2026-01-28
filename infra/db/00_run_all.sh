#!/bin/sh
set -eu

echo "▶ Running init scripts..."
for f in /docker-entrypoint-initdb.d/init/*.sql; do
  [ -e "$f" ] || continue
  echo "  -> $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "▶ Running migrations..."
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
  [ -e "$f" ] || continue
  echo "  -> $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "▶ Running seeds..."
for f in /docker-entrypoint-initdb.d/seeds/*.sql; do
  [ -e "$f" ] || continue
  echo "  -> $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "✅ All DB scripts executed."
