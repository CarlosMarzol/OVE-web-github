#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 scripts/export_dashboard_from_postgres.py

if git diff --quiet -- assets/data/indicadores-clave; then
  echo "No dashboard data changes."
  exit 0
fi

git config user.name "${GIT_COMMITTER_NAME:-OVE data bot}"
git config user.email "${GIT_COMMITTER_EMAIL:-data@observatoriovenezolanoeconomia.org}"
git add assets/data/indicadores-clave
git commit -m "Update OVE dashboard data from PostgreSQL"
git push origin HEAD:main
