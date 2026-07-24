#!/bin/bash

# Supabase Migration Automation Script
# This script automates the full Supabase integration flow

set -e

PROJECT_REF="ngohyujweyxmrbbusufa"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "🚀 Supabase CLI Automation Script"
echo "=================================="
echo ""
echo "Project: $SUPABASE_URL"
echo ""

# Step 1: Check if authenticated
echo "📝 Step 1: Checking Supabase CLI authentication..."
echo ""

if ! supabase projects list > /dev/null 2>&1; then
  echo "⚠️  Not authenticated with Supabase"
  echo ""
  echo "You have two options:"
  echo ""
  echo "OPTION A: Use Supabase Dashboard (Recommended)"
  echo "  1. Go to: https://app.supabase.com"
  echo "  2. Select project: $PROJECT_REF"
  echo "  3. Click: SQL Editor → New Query"
  echo "  4. For each migration file (001-007):"
  echo "     - Open: supabase/migrations/XXX_*.sql"
  echo "     - Copy all content"
  echo "     - Paste into SQL Editor"
  echo "     - Click Run"
  echo ""
  echo "OPTION B: Use Service Role Key (Advanced)"
  echo "  1. Get your Service Role Key from:"
  echo "     - Supabase Dashboard → Project Settings → API Keys"
  echo "     - Copy the 'Service Role Secret' key"
  echo "  2. Run:"
  echo "     export SUPABASE_SERVICE_ROLE_KEY=\"your-key-here\""
  echo "     node deploy-migrations.js"
  echo ""
  exit 0
fi

echo "✅ Authenticated with Supabase"
echo ""

# Step 2: Link project
echo "📝 Step 2: Linking to Supabase project..."
echo ""

supabase link --project-ref $PROJECT_REF

echo "✅ Project linked"
echo ""

# Step 3: Deploy migrations
echo "📝 Step 3: Deploying database migrations..."
echo ""

supabase db push

echo "✅ Migrations deployed"
echo ""

# Step 4: Show success message
echo "✨ All done!"
echo ""
echo "Next steps:"
echo "  1. ✅ Verify tables in Dashboard → Database → Tables"
echo "  2. ✅ Enable Auth providers: Dashboard → Auth → Providers"
echo "  3. ✅ Test the app: npm run start"
echo ""
