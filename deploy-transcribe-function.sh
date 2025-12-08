#!/bin/bash

# Deployment script for transcribe-audio edge function
# This script helps you deploy the function using the Supabase CLI

echo "🚀 Deploying transcribe-audio edge function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo ""
    echo "Please install it first:"
    echo "  macOS/Linux: brew install supabase/tap/supabase"
    echo "  Windows: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "           scoop install supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if logged in
echo "Checking Supabase authentication..."
if ! supabase status &> /dev/null; then
    echo "Please log in to Supabase:"
    supabase login
fi

# Link to project if not already linked
echo "Linking to Supabase project..."
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
echo ""
echo "Deploying function..."
supabase functions deploy transcribe-audio

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  Important: Make sure your OPENAI_API_KEY is set in Supabase secrets:"
echo "   supabase secrets set OPENAI_API_KEY=your_openai_api_key_here"
