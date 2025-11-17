# 🔍 How to Find Your Database Connection String

You're currently on the **API Settings** page, but we need the **Database Connection String**.

## Steps to Get Database Connection String:

### Option 1: Direct Link
Go directly to the database settings:
**https://app.supabase.com/project/vjwgygfllehhbccbflng/settings/database**

### Option 2: Navigate Manually
1. Go to: https://app.supabase.com/project/vjwgygfllehhbccbflng
2. Click **"Settings"** in the left sidebar (gear icon)
3. Click **"Database"** in the settings menu
4. Scroll down to find **"Connection Info"** section
5. Look for **"Connection string"** (not "URI" or "JDBC")
6. It will be under "Session mode" or "Transaction mode"

### What You're Looking For:
The connection string will look like one of these:

**Session Pooler (Recommended):**
```
postgresql://postgres.vjwgygfllehhbccbflng:[YOUR-PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

**Direct Connection:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.vjwgygfllehhbccbflng.supabase.co:5432/postgres
```

**Important:** The connection string will have your password already filled in!

### After You Get It:
1. Copy the ENTIRE connection string
2. Add `?sslmode=require` at the end
3. Paste it here and I'll update your .env file

## Quick Links:
- Database Settings: https://app.supabase.com/project/vjwgygfllehhbccbflng/settings/database
- Project Dashboard: https://app.supabase.com/project/vjwgygfllehhbccbflng
