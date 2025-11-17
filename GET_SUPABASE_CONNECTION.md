# How to Get Your Supabase Database Connection String

## Quick Steps

1. **Go to your Supabase Dashboard:**
   - Visit: https://app.supabase.com/project/vjwgygfllehhbccbflng/settings/database
   - Or: https://app.supabase.com → Select your project → Settings → Database

2. **Find Connection Info:**
   - Scroll down to the "Connection Info" section
   - You'll see several connection methods

3. **Copy the Connection String:**
   - Look for "Connection string" (not "URI" or "JDBC")
   - It should look like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
   - Or for direct connection:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

4. **Recommended: Use Session Pooler**
   - The Session Pooler connection is more reliable
   - It uses IPv4 and works better with most networks
   - Format: `postgresql://postgres.vjwgygfllehhbccbflng:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

5. **Add SSL Parameter:**
   - Add `?sslmode=require` to the end of the connection string
   - Example:
     ```
     postgresql://postgres.vjwgygfllehhbccbflng:Jahbless111.@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
     ```

6. **Update Your .env File:**
   - Replace the `DATABASE_URL` in `RL/.env` with the connection string from Supabase
   - Make sure to include `?sslmode=require` at the end

## If Your Project is Paused

If you see "Project is paused" in the dashboard:
1. Click the "Restore" button
2. Wait a few minutes for the project to activate
3. Then get the connection string

## Test the Connection

After updating `.env`, test with:
```bash
cd /Users/staccks/Desktop/Rledger/RL
npm run dev
```

## Need Help?

- Supabase Docs: https://supabase.com/docs/guides/database/connecting-to-postgres
- Check project status: https://app.supabase.com/project/vjwgygfllehhbccbflng

