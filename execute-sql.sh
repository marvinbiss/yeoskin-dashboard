#!/bin/bash
# Execute SQL in Supabase using the REST API

SUPABASE_URL="https://juqlogfujiagtpvxmeux.supabase.co"
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
fi

# Read SQL file content
SQL_CONTENT=$(cat sql-to-run.sql)

echo "Executing SQL via Supabase REST API..."
echo ""

# Execute via rpc endpoint (if exec_sql function exists)
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d "{\"query\": \"SELECT 1\"}"

echo ""
echo "Done!"
