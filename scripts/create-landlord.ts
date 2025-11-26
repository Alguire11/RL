import { hashPassword } from '../server/passwords';
import { storage } from '../server/storage';
import { nanoid } from 'nanoid';

async function createLandlord() {
    const password = 'Test1234!';
    const hashedPassword = await hashPassword(password);

    const user = await storage.createUserWithRLID({
        id: nanoid(),
        email: 'f76409.88@gmail.com',
        username: 'f76409.88@gmail.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Landlord',
        phone: '+1234567890',
        businessName: 'Test Properties Ltd',
        role: 'landlord',
        isOnboarded: true,
        emailVerified: true,
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        isActive: true
    }, 'LRLID-');

    console.log('✅ Landlord account created successfully!');
    console.log('Email: f76409.88@gmail.com');
    console.log('Password: Test1234!');
    console.log('RLID:', user.rlid);
    process.exit(0);
}

createLandlord().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
