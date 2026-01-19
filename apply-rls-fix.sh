#!/bin/bash
# Script to apply the Access Request RLS fix migration
# This script helps you apply the migration using Supabase CLI

set -e

echo "🔧 NeuroBloom - Access Request RLS Fix Migration"
echo "=================================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "📋 Project is not linked yet."
    echo ""
    echo "To link your project:"
    echo "  1. Get your project reference ID from https://app.supabase.com"
    echo "  2. Run: supabase login"
    echo "  3. Run: supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Alternatively, you can apply the migration manually:"
    echo "  1. Go to https://app.supabase.com → Your Project → SQL Editor"
    echo "  2. Open: supabase/fix-access-request-rls.sql"
    echo "  3. Copy and paste the SQL, then click Run"
    echo ""
    exit 0
fi

echo "🚀 Applying migration..."
echo ""

# Try to push the migration
if supabase db push; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test the SMS access request feature in your app"
    echo "  2. Verify the fix resolved the RLS error"
    echo ""
else
    echo ""
    echo "⚠️  Migration push failed or requires manual intervention"
    echo ""
    echo "💡 Alternative: Apply manually via Supabase Dashboard"
    echo "  1. Go to https://app.supabase.com"
    echo "  2. Open your project → SQL Editor"
    echo "  3. Open: supabase/fix-access-request-rls.sql"
    echo "  4. Copy and paste the SQL, then click Run"
    echo ""
fi
