require('dotenv').config({ path: '.env.test' });

const { sequelize } = require('../src/models');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/choice_talent_test';

beforeAll(async () => {
  // Sync database for tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection after all tests
  await sequelize.close();
}); 