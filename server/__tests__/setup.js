import { clearAllTables, closeDatabase } from '../db.js';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;  // Use a different port for testing

// Clear all data before each test
beforeEach(async () => {
    clearAllTables();
});

// Close database connection after all tests
afterAll(async () => {
    await closeDatabase();
});

// Add a dummy test to satisfy Jest
test('setup file initializes test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
});