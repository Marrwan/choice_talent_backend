const request = require('supertest');
const app = require('../src/server');
const { User, sequelize } = require('../src/models');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clean database before each test
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email.toLowerCase());
      expect(response.body.data.user.name).toBe(validUser.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should not register user with existing email', async () => {
      // Create user first
      await User.create({
        email: validUser.email,
        passwordHash: validUser.password,
        name: validUser.name
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: validUser.email
          // Missing password and name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    beforeEach(async () => {
      // Create a user for login tests
      await User.create({
        email: userData.email,
        passwordHash: userData.password,
        name: userData.name
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    test('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    beforeEach(async () => {
      await User.create({
        email: userData.email,
        passwordHash: userData.password,
        name: userData.name
      });
    });

    test('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: userData.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });

    test('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    beforeEach(async () => {
      // Create user and get token
      const user = await User.create({
        email: userData.email,
        passwordHash: userData.password,
        name: userData.name
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.token;
    });

    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    test('should not logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 