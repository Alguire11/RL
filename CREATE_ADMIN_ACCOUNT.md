# 🔐 Create Admin Account - Ismail

**Instructions to create the ultimate admin account for Ismail**

---

## Method 1: Using Admin API Endpoint (Recommended)

Once you have an existing admin account (e.g., `admin` / `admin123`), you can create the new admin account via API:

### Steps:

1. **Login as existing admin** at `/admin-login` with:
   - Username: `admin`
   - Password: `admin123`

2. **Call the admin creation endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/create-admin-account \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -d '{
       "username": "Ismail",
       "password": "Jahbless101",
       "email": "ismail@enoikio.co.uk",
       "firstName": "Ismail",
       "lastName": "Admin"
     }'
   ```

   Or use the browser console while logged in as admin:
   ```javascript
   fetch('/api/admin/create-admin-account', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({
       username: 'Ismail',
       password: 'Jahbless101',
       email: 'ismail@enoikio.co.uk',
       firstName: 'Ismail',
       lastName: 'Admin'
     })
   }).then(r => r.json()).then(console.log);
   ```

---

## Method 2: Using Direct Script (Requires Database Access)

If you have direct database access and the server is running:

```bash
cd RL
npx tsx scripts/create-admin-ismail.ts
```

**Note:** This requires `DATABASE_URL` environment variable to be set.

---

## Method 3: Manual Database Insert (Advanced)

If you need to create the account directly in the database:

1. **Hash the password:**
   ```bash
   node -e "const {hashPassword} = require('./server/passwords'); hashPassword('Jahbless101').then(console.log)"
   ```

2. **Insert into database:**
   - Create user in `users` table with:
     - `id`: Generate unique ID (nanoid)
     - `username`: "Ismail"
     - `password`: Hashed password from step 1
     - `email`: "ismail@enoikio.co.uk"
     - `role`: "admin"
     - `isActive`: true
     - `subscriptionPlan`: "premium"
     - `subscriptionStatus`: "active"
   
   - Create admin entry in `admin_users` table:
     - `userId`: The user ID from above
     - `role`: "admin"
     - `isActive`: true
     - `permissions`: ["all"]

---

## Account Details

Once created, the account will have:

```
Username: Ismail
Password: Jahbless101
Email: ismail@enoikio.co.uk
Role: admin
Permissions: all (full access)
Subscription: Premium (all features unlocked)
```

**Login URL:** `http://localhost:5000/admin-login`

---

## Verification

After creating the account, verify it works:

1. Logout from current admin session
2. Login at `/admin-login` with:
   - Username: `Ismail`
   - Password: `Jahbless101`
3. You should be redirected to `/admin` dashboard
4. All admin features should be accessible

---

## Security Notes

- ✅ Password is hashed using scrypt (secure)
- ✅ Account has full admin permissions
- ✅ All admin actions will be logged to audit trail
- ✅ Account is marked as active and verified
- ⚠️ Change password in production if needed
- ⚠️ Consider enabling 2FA for production use

---

## Troubleshooting

### Account Already Exists
If the username "Ismail" already exists, the script/endpoint will:
- Update the existing user to admin role
- Create/update the admin_users entry
- Reset the password to the new one

### Permission Denied
- Ensure you're logged in as an existing admin
- Check that the `requireAdmin` middleware is working
- Verify session is valid

### Database Connection Error
- Check `DATABASE_URL` environment variable
- Ensure database is accessible
- Verify network connectivity

---

**Created:** December 2024  
**Status:** Ready to use

