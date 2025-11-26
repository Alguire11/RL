import { apiRequest } from "./client/src/lib/queryClient"; // Can't use this in node script easily
// We'll use fetch directly
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { fetch as fetchCookie } from 'fetch-cookie';

const baseUrl = 'http://localhost:5000';
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

async function verify() {
    const email = `verify.${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`1. Registering landlord: ${email}`);
    const regRes = await fetchWithCookies(`${baseUrl}/api/landlord/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            firstName: 'Verify',
            lastName: 'Script',
            phone: '07700900000',
            businessName: 'Verify Props'
        })
    });

    if (!regRes.ok) {
        console.error('Registration failed:', await regRes.text());
        return;
    }
    console.log('Registration successful');

    console.log('2. Logging in');
    const loginRes = await fetchWithCookies(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: email,
            password
        })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }
    console.log('Login successful');

    console.log('3. Creating Property');
    const propRes = await fetchWithCookies(`${baseUrl}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            address: '123 Verify Lane',
            city: 'Test City',
            postcode: 'TE1 1ST',
            monthlyRent: 1500,
            type: 'apartment',
            bedrooms: 2
        })
    });

    if (!propRes.ok) {
        console.error('Create property failed:', await propRes.text());
        return;
    }
    const property = await propRes.json();
    console.log('Property created:', property.id);

    console.log('4. Inviting Tenant');
    const inviteRes = await fetchWithCookies(`${baseUrl}/api/landlord/invite-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'tenant.verify@example.com',
            propertyId: property.id,
            propertyAddress: property.address
        })
    });

    if (!inviteRes.ok) {
        console.error('Invite failed:', await inviteRes.text());
        return;
    }
    const inviteResult = await inviteRes.json();
    console.log('Invite result:', inviteResult);

    if (inviteResult.success) {
        console.log('✅ VERIFICATION SUCCESSFUL');
    } else {
        console.error('❌ VERIFICATION FAILED');
    }
}

verify().catch(console.error);
