# 🚀 Quick Guide: Create Admin Account for Ismail

## ✅ Account Details
```
Username: Ismail
Password: Jahbless101
Email: ismail@enoikio.co.uk
```

---

## 📝 Method: Use Browser Console (Easiest)

1. **Start your server:**
   ```bash
   cd RL
   npm run dev
   ```

2. **Login as existing admin** (e.g., `admin` / `admin123`) at:
   ```
   http://localhost:5000/admin-login
   ```

3. **Open browser console** (F12) and run:
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
   })
   .then(r => r.json())
   .then(data => {
     console.log('✅ Success:', data);
     alert('Admin account created! Username: Ismail, Password: Jahbless101');
   })
   .catch(err => {
     console.error('❌ Error:', err);
     alert('Error creating account. Check console.');
   });
   ```

4. **Verify:** Logout and login with `Ismail` / `Jahbless101`

---

## 🔧 Alternative: Use cURL

```bash
# First, login and get session cookie, then:
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

---

## ✅ Verification

After creation, test login:
1. Go to: `http://localhost:5000/admin-login`
2. Enter:
   - Username: `Ismail`
   - Password: `Jahbless101`
3. You should be redirected to `/admin` dashboard
4. All admin features should be accessible

---

**That's it! Your admin account is ready to use.** 🎉

