// Test script to verify plan calculation
const { mockUsers, getUserPlan, getUserTotalCattle } = require('./src/mocks/mock-auth.ts');

// Get the test user
const testUser = mockUsers[0]; // João Silva

// Calculate total cattle
const totalCattle = getUserTotalCattle(testUser);
console.log('Total cattle:', totalCattle);

// Get user plan
const userPlan = getUserPlan(testUser);
console.log('User plan:', userPlan);

// Expected: Barão plan (since 7040 > 3000)
console.log('Expected plan: Barão');
console.log('Actual plan:', userPlan.name);
console.log('Test passed:', userPlan.name === 'Barão');
