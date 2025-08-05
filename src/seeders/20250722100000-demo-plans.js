'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const plans = [
      {
        id: uuidv4(),
        name: 'Basic',
        price: 0, // Free
        duration: 30, // 30 days
        features: ['Response-Only Account', 'Can receive: Chat, Audio Call, Video Call', 'Cannot initiate matchmaking'],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Premium',
        price: 1000000, // ₦10,000 in kobo (1000 * 100)
        duration: 30, // 30 days
        features: ['Initiate & receive Chat, Audio Calls, Video Calls', 'Access to Matchmaking System', 'Set matchmaking preferences', 'Submit matchmaking form', 'Discover and connect with compatible matches', 'Send interest messages', 'Build serious relationships'],
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];
    await queryInterface.bulkInsert('plans', plans, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plans', null, {});
  },
}; 