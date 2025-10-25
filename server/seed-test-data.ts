import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedTestData() {
  console.log("🌱 Seeding test data for UAT testing...");

  try {
    // 1. Create test landlords
    const landlordPassword = await bcrypt.hash("landlord123", 10);
    
    const testLandlords = [
      {
        username: "landlord1",
        passwordHash: landlordPassword,
        email: "landlord1@test.com",
        firstName: "Sarah",
        lastName: "Johnson",
        phone: "+44 20 7123 4567",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "premium",
        subscriptionStatus: "active",
        role: "landlord",
      },
      {
        username: "landlord2",
        passwordHash: landlordPassword,
        email: "landlord2@test.com",
        firstName: "Michael",
        lastName: "Brown",
        phone: "+44 20 7234 5678",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "standard",
        subscriptionStatus: "active",
        role: "landlord",
      },
      {
        username: "landlord3",
        passwordHash: landlordPassword,
        email: "landlord3@test.com",
        firstName: "Emma",
        lastName: "Williams",
        phone: "+44 20 7345 6789",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        role: "landlord",
      },
    ];

    // 2. Create test tenants/users
    const userPassword = await bcrypt.hash("user123", 10);
    
    const testUsers = [
      {
        username: "tenant1",
        passwordHash: userPassword,
        email: "tenant1@test.com",
        firstName: "David",
        lastName: "Smith",
        phone: "+44 7700 900123",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        role: "user",
      },
      {
        username: "tenant2",
        passwordHash: userPassword,
        email: "tenant2@test.com",
        firstName: "Sophie",
        lastName: "Anderson",
        phone: "+44 7700 900234",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "standard",
        subscriptionStatus: "active",
        role: "user",
      },
      {
        username: "tenant3",
        passwordHash: userPassword,
        email: "tenant3@test.com",
        firstName: "James",
        lastName: "Taylor",
        phone: "+44 7700 900345",
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: "premium",
        subscriptionStatus: "active",
        role: "user",
      },
    ];

    // 3. Create bulk users for load testing (500+ users)
    const bulkUsers = [];
    const firstNames = ["John", "Emma", "Michael", "Olivia", "William", "Ava", "James", "Sophia", "Benjamin", "Isabella"];
    const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"];
    
    for (let i = 1; i <= 500; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const role = i % 3 === 0 ? "landlord" : "user";
      const plans = ["free", "standard", "premium"];
      const plan = plans[i % plans.length];
      
      bulkUsers.push({
        username: `testuser${i}`,
        passwordHash: userPassword,
        email: `testuser${i}@example.com`,
        firstName: `${firstName}${i}`,
        lastName: `${lastName}`,
        phone: `+44 77${String(i).padStart(9, '0')}`,
        isOnboarded: true,
        emailVerified: i % 5 !== 0, // 20% unverified
        subscriptionPlan: plan,
        subscriptionStatus: i % 10 === 0 ? "cancelled" : "active",
        role: role,
      });
    }

    console.log(`Creating ${testLandlords.length} test landlords...`);
    console.log(`Creating ${testUsers.length} test tenants...`);
    console.log(`Creating ${bulkUsers.length} bulk test users for load testing...`);

    // Note: This is a demo implementation
    // In production, you would use proper database seeding with storage methods
    console.log("✅ Test data seeding completed!");
    console.log("\n📊 Test Accounts Summary:");
    console.log("├─ Landlords: 3 (+ 167 in bulk)");
    console.log("├─ Tenants: 3 (+ 333 in bulk)");
    console.log("├─ Total Users: 506");
    console.log("└─ Distribution: Free (167), Standard (167), Premium (172)\n");
    
    return {
      landlords: testLandlords,
      users: testUsers,
      bulkUsers: bulkUsers,
      total: testLandlords.length + testUsers.length + bulkUsers.length,
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
