#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "Cleaning node_modules and package-lock.json to fix native binding issues..."
rm -rf node_modules package-lock.json

echo "Installing npm dependencies (includes prisma generate via postinstall)..."
npm install

echo "Starting PostgreSQL..."
sudo service postgresql start

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -q; do
  sleep 1
done

echo "Creating database if it doesn't exist..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'okunos'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE okunos;"

echo "Running prisma db push..."
npx prisma db push --skip-generate

echo "Session start hook completed successfully."
