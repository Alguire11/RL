# Supabase Connection Troubleshooting Guide

## Current Issue: DNS Resolution Failure

The hostname `db.vysuofkigumekvvjxhak.supabase.co` cannot be resolved. This could mean:

1. **Supabase Project is Paused**: Free tier projects pause after inactivity
2. **Incorrect Hostname**: The connection string might be outdated
3. **Network Issue**: DNS resolution problems

## Solutions

### 1. Verify Your Supabase Project Status

1. Go to https://app.supabase.com
2. Log in to your account
3. Check if your project `vysuofkigumekvvjxhak` is active
4. If paused, click "Restore" to reactivate it

### 2. Get the Correct Connection String

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Under **Connection Info**, find the connection string
3. Copy the **Connection string** (not the URI)
4. It should look like one of these:

**Direct Connection (IPv6):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

**Session Pooler (IPv4 - Recommended for most cases):**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

**Transaction Pooler (Serverless):**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

### 3. Update Your .env File

Replace the `DATABASE_URL` in your `.env` file with the correct connection string from Supabase dashboard.

**Important**: 
- Always include `?sslmode=require` for Supabase connections
- Use the **Session Pooler** connection if you're having DNS issues (it uses IPv4)
- Make sure your password doesn't contain special characters that need URL encoding

### 4. Test the Connection

After updating, test with:
```bash
npm run dev
```

Or test the connection directly:
```bash
node -e "import('dotenv').then(d => { d.config(); import('./server/db.js').then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message)); });"
```

### 5. Alternative: Use Pooler Connection

If direct connection fails, try the **Session Pooler** connection string from your Supabase dashboard. It's more reliable and supports IPv4.

## Common Issues

### Issue: "ENOTFOUND" Error
- **Cause**: DNS cannot resolve the hostname
- **Solution**: Use the pooler connection string or verify project is active

### Issue: "SSL required" Error
- **Cause**: Missing SSL parameters
- **Solution**: Add `?sslmode=require` to connection string

### Issue: "Connection refused"
- **Cause**: Project might be paused or password incorrect
- **Solution**: Check project status in Supabase dashboard

## Need Help?

1. Check Supabase Status: https://status.supabase.com
2. Supabase Docs: https://supabase.com/docs/guides/database/connecting-to-postgres
3. Verify your project is active in the Supabase dashboard

