# ⚠️ IMPORTANT: Get Your Exact Connection String

The connection string format needs to match exactly what Supabase provides.

## Steps:

1. **Go to your Supabase Dashboard:**
   https://app.supabase.com/project/vjwgygfllehhbccbflng/settings/database

2. **Find "Connection Info" section**

3. **Look for "Connection string" (Session mode)**
   - It should show something like:
     ```
     postgresql://postgres.vjwgygfllehhbccbflng:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
   - The [REGION] will be your actual region (e.g., `us-east-1`, `eu-west-1`, etc.)

4. **Copy the ENTIRE connection string** (it will have your password already filled in)

5. **Add SSL parameter:**
   - Add `?sslmode=require` to the end
   - Example:
     ```
     postgresql://postgres.vjwgygfllehhbccbflng:Jahbless101.@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
     ```

6. **Paste it here** and I'll update your .env file, OR update it yourself in `RL/.env`

## Quick Link:
https://app.supabase.com/project/vjwgygfllehhbccbflng/settings/database

The region in the connection string must match your Supabase project's region!
