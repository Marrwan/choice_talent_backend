const request = require('supertest');
const app = require('../src/server'); // assuming your express app is exported from server.js
const { sequelize } = require('../src/models');

// Mock data
const TEST_USER_TOKEN = 'xyz';  // you should replace this with a real token from your auth system
const TEST_GROUP_ID = '123e4567-e89b-12d3-a456-426614174000'; // replace with a real group id
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174001'; 

describe('Group Call API Endpoints', () => {
  beforeAll(async () => {
    // Synchronizing database, seeding, etc.
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Cleanup, closing database, etc.
    await sequelize.close();
  });

  it('should create a new group call', async () => {
    const res = await request(app)
      .post('/api/calls/group/create')
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`)
      .send({
        group_id: TEST_GROUP_ID,
        call_type: 'audio',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it('should join the group call', async () => {
    const callId = '123e4567-e89b-12d3-a456-426614174002'; // replace with an actual call ID
    const res = await request(app)
      .post(`/api/calls/group/${callId}/join`)
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`)
      .send({
        audio_enabled: true,
        video_enabled: false,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('should leave the group call', async () => {
    const callId = '123e4567-e89b-12d3-a456-426614174002';
    const res = await request(app)
      .post(`/api/calls/group/${callId}/leave`)
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('should end the group call', async () => {
    const callId = '123e4567-e89b-12d3-a456-426614174002';
    const res = await request(app)
      .post(`/api/calls/group/${callId}/end`)
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

