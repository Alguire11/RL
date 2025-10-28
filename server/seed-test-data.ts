import { storage } from "./storage";
import { hashPassword } from "./passwords";
import { nanoid } from "nanoid";

export async function seedTestData() {
  console.log("🌱 Seeding test data for UAT testing...");

  try {
    const landlordPassword = await hashPassword("landlord123");
    const userPassword = await hashPassword("user123");
    
    let createdCount = 0;
    
    // 1. Create named test landlords
    const namedLandlords = [
      { username: "landlord1", email: "landlord1@test.com", firstName: "Sarah", lastName: "Johnson", phone: "+44 20 7123 4567", plan: "premium" },
      { username: "landlord2", email: "landlord2@test.com", firstName: "Michael", lastName: "Brown", phone: "+44 20 7234 5678", plan: "standard" },
      { username: "landlord3", email: "landlord3@test.com", firstName: "Emma", lastName: "Williams", phone: "+44 20 7345 6789", plan: "free" },
    ];

    console.log("Creating named test landlords...");
    for (const landlord of namedLandlords) {
      try {
        await storage.upsertUser({
          id: nanoid(),
          username: landlord.username,
          password: landlordPassword,
          email: landlord.email,
          firstName: landlord.firstName,
          lastName: landlord.lastName,
          phone: landlord.phone,
          isOnboarded: true,
          emailVerified: true,
          subscriptionPlan: landlord.plan,
          subscriptionStatus: "active",
          role: "landlord",
        });
        createdCount++;
      } catch (e) {
        console.log(`Landlord ${landlord.username} may already exist, skipping...`);
      }
    }

    // 2. Create named test tenants
    const namedTenants = [
      { username: "tenant1", email: "tenant1@test.com", firstName: "David", lastName: "Smith", phone: "+44 7700 900123", plan: "free" },
      { username: "tenant2", email: "tenant2@test.com", firstName: "Sophie", lastName: "Anderson", phone: "+44 7700 900234", plan: "standard" },
      { username: "tenant3", email: "tenant3@test.com", firstName: "James", lastName: "Taylor", phone: "+44 7700 900345", plan: "premium" },
    ];

    console.log("Creating named test tenants...");
    for (const tenant of namedTenants) {
      try {
        await storage.upsertUser({
          id: nanoid(),
          username: tenant.username,
          password: userPassword,
          email: tenant.email,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          phone: tenant.phone,
          isOnboarded: true,
          emailVerified: true,
          subscriptionPlan: tenant.plan,
          subscriptionStatus: "active",
          role: "user",
        });
        createdCount++;
      } catch (e) {
        console.log(`Tenant ${tenant.username} may already exist, skipping...`);
      }
    }

    // 3. Create bulk users for load testing (500 users)
    console.log("Creating bulk test users for load testing...");
    const firstNames = ["John", "Emma", "Michael", "Olivia", "William", "Ava", "James", "Sophia", "Benjamin", "Isabella"];
    const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"];
    const plans = ["free", "standard", "premium"];
    
    for (let i = 1; i <= 500; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const role = i % 3 === 0 ? "landlord" : "user";
      const plan = plans[i % plans.length];
      
      try {
        await storage.upsertUser({
          id: nanoid(),
          username: `testuser${i}`,
          password: userPassword,
          email: `testuser${i}@example.com`,
          firstName: `${firstName}${i}`,
          lastName: lastName,
          phone: `+44 77${String(i).padStart(9, '0')}`,
          isOnboarded: true,
          emailVerified: i % 5 !== 0, // 20% unverified
          subscriptionPlan: plan,
          subscriptionStatus: i % 10 === 0 ? "cancelled" : "active",
          role: role,
        });
        createdCount++;
        
        if (i % 50 === 0) {
          console.log(`Created ${i}/500 bulk users...`);
        }
      } catch (e) {
        // User might already exist
      }
    }

    // 4. Create properties for landlords
    console.log("Creating properties for landlords...");
    const allUsers = await storage.getAllUsers();
    const landlordUsers = allUsers.filter(u => u.role === 'landlord').slice(0, 50); // First 50 landlords
    const tenantUsers = allUsers.filter(u => u.role === 'user').slice(0, 100); // First 100 tenants
    
    let propertyCount = 0;
    for (const landlord of landlordUsers) {
      const numProperties = Math.floor(Math.random() * 3) + 1; // 1-3 properties per landlord
      for (let p = 0; p < numProperties; p++) {
        try {
          await storage.createProperty({
            userId: landlord.id,
            address: `${100 + propertyCount} Test Street`,
            city: ['London', 'Manchester', 'Birmingham', 'Leeds'][propertyCount % 4],
            postcode: `SW${Math.floor(propertyCount / 10)}${propertyCount % 10} ${Math.floor(Math.random() * 9)}AA`,
            // Only seed columns that exist in the schema to keep Drizzle happy
            monthlyRent: (800 + Math.floor(Math.random() * 1200)).toString(),
          });
          propertyCount++;
        } catch (e) {
          // Property might have constraint issues
        }
      }
    }
    console.log(`Created ${propertyCount} properties`);

    // 5. Create rent payments for tenants
    console.log("Creating rent payments...");
    const allProperties = await storage.getAllProperties();
    let paymentCount = 0;
    
    for (let i = 0; i < Math.min(tenantUsers.length, allProperties.length); i++) {
      const tenant = tenantUsers[i];
      const property = allProperties[i % allProperties.length];
      
      // Create 3-8 historical payments for each tenant
      const numPayments = Math.floor(Math.random() * 6) + 3;
      for (let p = 0; p < numPayments; p++) {
        try {
          const monthsAgo = numPayments - p;
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() - monthsAgo);
          
          const paidDate = new Date(dueDate);
          paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5));
          
          const isVerified = p < numPayments - 1; // Most historical ones verified
          const isPending = !isVerified && Math.random() > 0.3;
          
          await storage.createRentPayment({
            userId: tenant.id,
            propertyId: property.id,
            amount: property.monthlyRent,
            dueDate: dueDate.toISOString().split('T')[0],
            paidDate: paidDate.toISOString().split('T')[0],
            status: isVerified ? 'paid' : (isPending ? 'pending' : 'late'),
            paymentMethod: ['bank_transfer', 'card', 'direct_debit'][Math.floor(Math.random() * 3)],
            isVerified: isVerified,
          });
          paymentCount++;
        } catch (e) {
          // Payment might have constraint issues
        }
      }
    }
    console.log(`Created ${paymentCount} rent payments`);

    // 6. Create security logs for audit trail
    console.log("Creating security logs...");
    let logCount = 0;
    const sampleUsers = allUsers.slice(0, 50);
    const actions = ['login', 'logout', 'update_profile', 'add_property', 'verify_payment', 'export_data'];
    
    for (const user of sampleUsers) {
      const numLogs = Math.floor(Math.random() * 10) + 5; // 5-15 logs per user
      for (let l = 0; l < numLogs; l++) {
        try {
          const logDate = new Date();
          logDate.setDate(logDate.getDate() - Math.floor(Math.random() * 30));
          
          await storage.createSecurityLog({
            userId: user.id,
            action: actions[Math.floor(Math.random() * actions.length)],
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Test User Agent)',
            createdAt: logDate,
            metadata: {},
          });
          logCount++;
        } catch (e) {
          // Log might have issues
        }
      }
    }
    console.log(`Created ${logCount} security logs`);

    console.log("\n✅ Test data seeding completed!");
    console.log(`\n📊 Complete Test Data Summary:`);
    console.log(`├─ Users: ${createdCount}`);
    console.log(`├─ Properties: ${propertyCount}`);
    console.log(`├─ Payments: ${paymentCount}`);
    console.log(`├─ Security Logs: ${logCount}`);
    console.log(`└─ Total Records: ${createdCount + propertyCount + paymentCount + logCount}\n`);
    
    return {
      users: createdCount,
      properties: propertyCount,
      payments: paymentCount,
      securityLogs: logCount,
      total: createdCount + propertyCount + paymentCount + logCount,
    };
  } catch (error) {
    console.error("Error seeding test data:", error);
    throw error;
  }
}

export const testAccounts = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin",
    description: "Full system administrator access",
  },
  landlord: {
    username: "landlord",
    password: "landlord123",
    role: "landlord",
    description: "Landlord with property management access",
  },
  user: {
    username: "user",
    password: "user123",
    role: "user",
    description: "Tenant/user with rent tracking access",
  },
  testLandlords: [
    { username: "landlord1", password: "landlord123", plan: "premium" },
    { username: "landlord2", password: "landlord123", plan: "standard" },
    { username: "landlord3", password: "landlord123", plan: "free" },
  ],
  testTenants: [
    { username: "tenant1", password: "user123", plan: "free" },
    { username: "tenant2", password: "user123", plan: "standard" },
    { username: "tenant3", password: "user123", plan: "premium" },
  ],
};
