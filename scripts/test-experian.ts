
import { generateDetailRecord, generateHeader, generateTrailer } from "../server/services/experian-export";

// Mock Data
const user = {
    firstName: "John",
    lastName: "Doe"
};

const tenancy = {
    tenancyRef: "TEN1234567890",
    monthlyRent: "500.00",
    outstandingBalance: "0.00",
    startDate: new Date("2023-01-01"),
    endDate: null
};

const tenancyArrears = {
    tenancyRef: "TEN9876543210",
    monthlyRent: "1000.00",
    outstandingBalance: "1500.00", // 1.5 months
    startDate: new Date("2023-06-01"),
    endDate: null
};

const profile = {
    title: "Mr",
    middleName: "A",
    dateOfBirth: new Date("1980-05-20"),
    previousAddress: "123 Old St, London",
    goneAway: false,
    evictionFlag: false
};

const profileEvicted = {
    title: "Ms",
    middleName: "",
    dateOfBirth: new Date("1990-12-12"),
    previousAddress: "",
    goneAway: true,
    evictionFlag: true
};

console.log("--- Header ---");
console.log(generateHeader("2023-12", "ADMIN001"));

console.log("\n--- Detail Record (Good Standing) ---");
const line1 = generateDetailRecord(user as any, tenancy as any, profile as any, false);
console.log(line1);
console.log("Length:", line1.length);

console.log("\n--- Detail Record (Arrears & Opt Out) ---");
const line2 = generateDetailRecord(user as any, tenancyArrears as any, profile as any, true); // Opt Out = 'D'?
console.log(line2);
console.log("Length:", line2.length);

console.log("\n--- Detail Record (Evicted) ---");
const line3 = generateDetailRecord(user as any, tenancyArrears as any, profileEvicted as any, false);
console.log(line3);

console.log("\n--- Trailer ---");
console.log(generateTrailer(3));
