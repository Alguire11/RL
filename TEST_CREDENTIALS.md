# 🧪 RentLedger Test Credentials & Access Guide

**Last Updated:** December 2024  
**Environment:** Development/Production  
**Purpose:** UAT Testing, Demo Access, Development Testing

---

## 📋 Quick Access Summary

| Role | Username | Password | Dashboard URL |
|------|----------|----------|---------------|
| **Admin (Ultimate)** | `Ismail` | `Jahbless101` | `/admin` |
| **Admin** | `admin` | `admin123` | `/admin` |
| **Landlord (Standard)** | `landlord` | `landlord123` | `/landlord-dashboard` |
| **Tenant (Free)** | `user` | `user123` | `/dashboard` |

---

## 👨‍💼 Admin Access

### Ultimate Admin Account (Full Access)
```
Username: Ismail
Password: Jahbless101
Role: Administrator
Access Level: Full system access (all permissions)
Email: ismail@enoikio.co.uk
```

### Primary Admin Account
```
Username: admin
Password: admin123
Role: Administrator
Access Level: Full system access
```

**Admin Dashboard Features:**
- ✅ System Overview & Metrics
- ✅ User Management (`/admin/users`)
- ✅ Property Oversight (`/admin/properties`)
- ✅ Subscription Management (`/admin/subscriptions`)
- ✅ Revenue Analytics (`/admin/revenue`)
- ✅ Moderation Queue (`/admin/moderation`)
- ✅ Audit Logs (`/admin/audit-logs`)
- ✅ System Settings (`/admin/settings`)
- ✅ Data Export
- ✅ System Health Monitoring

**Admin Test Scenarios:**
1. Login at `/admin-login`
2. View dashboard metrics (total users, active users, revenue)
3. Navigate to Users page - search, view, edit, suspend/reactivate users
4. Navigate to Properties page - view all properties
5. Navigate to Subscriptions page - view and manage user subscriptions
6. Navigate to Revenue page - view revenue analytics and charts
7. Navigate to Moderation page - review and resolve moderation items
8. Navigate to Audit Logs page - filter and view security logs
9. Navigate to Settings page - update system-wide settings
10. Test data export functionality
11. Test system health check

---

## 🏢 Landlord Access

### Primary Landlord Account
```
Username: landlord
Password: landlord123
Role: Landlord
Subscription: Standard Plan
Access Level: Property & tenant management
```

### Additional Landlord Test Accounts
```
Username: landlord1
Password: landlord123
Subscription: Premium Plan

Username: landlord2
Password: landlord123
Subscription: Standard Plan

Username: landlord3
Password: landlord123
Subscription: Free Plan
```

**Landlord Dashboard Features:**
- ✅ Property Management (Add, Edit, Delete)
- ✅ Tenant Invitations (Email & QR Code)
- ✅ Payment Verification (Approve/Reject/Pending)
- ✅ Analytics Dashboard
- ✅ Tenant List & Management
- ✅ Rent Ledger PDF Generation
- ✅ Support Request System

**Landlord Test Scenarios:**
1. Login at `/landlord-login`
2. View dashboard with property portfolio
3. Add a new property (test subscription limits)
4. Invite a tenant via email
5. Generate QR code for tenant onboarding
6. View pending payment verifications
7. Approve/Reject payment verifications
8. View analytics and verification rates
9. Download tenant rent ledger PDF
10. Submit support request

**Subscription Limits by Plan:**
- **Free:** 1 property max
- **Standard:** 3 properties max
- **Premium:** Unlimited properties

---

## 🏠 Tenant Access

### Primary Tenant Account
```
Username: user
Password: user123
Role: Tenant/User
Subscription: Free Plan
Access Level: Rent tracking & credit building
```

### Additional Tenant Test Accounts
```
Username: tenant1
Password: user123
Subscription: Free Plan

Username: tenant2
Password: user123
Subscription: Standard Plan

Username: tenant3
Password: user123
Subscription: Premium Plan
```

**Tenant Dashboard Features:**
- ✅ Payment Tracking & History
- ✅ Credit Score Progress Tracker
- ✅ Report Generation (with subscription limits)
- ✅ Property Management
- ✅ Profile Settings
- ✅ Support Requests
- ✅ Achievement Badges
- ✅ Data Export (Premium only)

**Tenant Test Scenarios:**
1. Login at `/auth` (or register new account)
2. View dashboard with payment stats and credit score
3. Add rent payment record
4. View payment history and status
5. Generate credit report (test report limits)
6. Share report (test WhatsApp sharing - Standard+)
7. Connect bank account (test Open Banking - Premium only)
8. View subscription status and upgrade options
9. Submit support request (test priority levels - Premium for high/urgent)
10. Export data (test enhanced exports - Premium only)

**Subscription Feature Gates:**
- **Free Plan:**
  - 1 report per month
  - Basic payment tracking
  - Basic dashboard
  
- **Standard Plan:**
  - 4 reports per month
  - WhatsApp sharing ✅
  - Advanced analytics ✅
  - Custom reminders ✅
  
- **Premium Plan:**
  - Unlimited reports
  - Open Banking integration ✅
  - Priority support (high/urgent) ✅
  - Enhanced data exports ✅
  - Custom reminder schedules ✅

---

## 🔐 Authentication Notes

### Session-Based Authentication
- All logins use secure session cookies
- Sessions persist across browser tabs
- Logout clears session on server
- Admin routes require `role: 'admin'` in session

### Security Features
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Session validation on all protected routes
- ✅ Audit logging for all admin actions
- ✅ IP address and user agent tracking

---

## 🧪 Testing Workflow

### 1. Initial Setup
```bash
# Start the development server
cd RL
npm run dev

# Or in production
npm start
```

### 2. Database Seeding (Optional)
```bash
# Login as admin first, then:
POST /api/admin/seed-test-data

# This creates:
# - 3 named landlords (landlord1, landlord2, landlord3)
# - 3 named tenants (tenant1, tenant2, tenant3)
# - 500 bulk test users
# - 150+ properties
# - 800+ payment records
```

### 3. Test Each Role

**Admin Testing:**
1. Navigate to `http://localhost:5000/admin-login`
2. Login with `admin` / `admin123`
3. Test all admin pages and features
4. Verify audit logs are created

**Landlord Testing:**
1. Navigate to `http://localhost:5000/landlord-login`
2. Login with `landlord` / `landlord123`
3. Test property management
4. Test tenant invitations
5. Test payment verifications

**Tenant Testing:**
1. Navigate to `http://localhost:5000/auth`
2. Login with `user` / `user123`
3. Test payment tracking
4. Test report generation
5. Test subscription features

---

## 📊 Expected Test Data

After seeding, you should see:
- **Users:** 506+ (3 named landlords, 3 named tenants, 500 bulk)
- **Properties:** 150+ (linked to landlords)
- **Payments:** 800+ (linked to tenants/properties)
- **Security Logs:** 250+ (audit trail)
- **Reports:** Various (linked to tenants)

---

## ⚠️ Important Notes

1. **Demo Credentials:** These are for testing only. Change passwords in production.

2. **Session Management:** 
   - Sessions are stored server-side
   - Use `credentials: 'include'` in fetch calls
   - Logout via `/api/logout` endpoint

3. **Subscription Testing:**
   - Free plan users see upgrade prompts
   - Standard plan users have WhatsApp sharing
   - Premium plan users have all features

4. **Admin Access:**
   - Admin routes are protected by `requireAdmin` middleware
   - All admin actions are logged to audit trail
   - Admin can seed test data (dev only)

5. **Environment Variables:**
   - `DATABASE_URL` - PostgreSQL connection
   - `SESSION_SECRET` - Session encryption key
   - `SENDGRID_API_KEY` - Email service (optional)
   - `STRIPE_SECRET_KEY` - Payment processing (optional)

---

## 🐛 Troubleshooting

### Cannot Login
- Check database connection
- Verify user exists in database
- Check session secret is set
- Clear browser cookies and try again

### Admin Access Denied
- Verify user has `role: 'admin'` in database
- Check `isActive: true` for admin user
- Verify session is valid

### Subscription Features Not Working
- Check user's `subscriptionPlan` in database
- Verify `subscriptionStatus: 'active'`
- Check subscription limits in `shared/subscription-types.ts`

---

## 📞 Support

For issues or questions:
- Check `UAT_TEST_RESULTS.md` for known issues
- Review `PRODUCTION_READY_SUMMARY.md` for feature status
- Check `ADMIN_UAT_TEST_RESULTS.md` for admin-specific tests

---

**Happy Testing! 🚀**

