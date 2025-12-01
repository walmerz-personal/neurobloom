# Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. **Go to your Supabase project**: https://app.supabase.com
2. Click on your **NeuroBloom** project
3. Go to **Settings** (gear icon in sidebar) → **API**
4. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key, NOT the service_role key)

## Step 2: Configure Environment Variables

1. Create a file called **`.env.local`** in the root of your project (next to package.json)
2. Add your credentials (replace with your actual values):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_OPENAI_API_KEY=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
```

## Step 3: Run the Database Schema

1. In Supabase, go to **SQL Editor** (in the sidebar)
2. Click **New Query**
3. Open the file `supabase/schema.sql` in this project
4. Copy ALL the SQL and paste it into the Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

## Step 4: Verify Tables Were Created

In the Supabase SQL Editor, run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- `conversations`
- `daily_logs`
- `user_profiles`
- `users`

## Step 5: Restart Expo

After adding environment variables, restart your Expo dev server:

1. Stop the current `npx expo start` (Ctrl+C)
2. Run `npx expo start` again
3. Press `r` to reload the app

## ✅ You're Done!

The app will now connect to your Supabase backend for authentication and data persistence.

---

## Troubleshooting

**Error: "Invalid API key"**
- Make sure you copied the **anon** key, not the service_role key
- Check for extra spaces in your .env.local file

**Error: "Cannot find module '@supabase/supabase-js'"**
- Run `npm install` to ensure packages are installed

**Tables not showing up**
- Make sure you ran the ENTIRE schema.sql file
- Check for SQL errors in the Supabase SQL Editor output
