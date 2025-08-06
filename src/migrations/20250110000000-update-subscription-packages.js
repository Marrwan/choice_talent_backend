'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing plans
    await queryInterface.bulkDelete('plans', null, {});
    
    // Insert new subscription packages
    await queryInterface.bulkInsert('plans', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: '0-2_years',
        price: 300000, // ₦3,000 in kobo
        duration: 180, // 6 months
        features: [
          'Career advisory',
          'Profile screening',
          'Job application feedback',
          'Profile assessment feedback',
          'Profile forwarding to employers'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: '3-5_years',
        price: 500000, // ₦5,000 in kobo
        duration: 180, // 6 months
        features: [
          'Career advisory',
          'Profile screening',
          'Job application feedback',
          'Profile assessment feedback',
          'Profile forwarding to employers'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: '6-7_years',
        price: 700000, // ₦7,000 in kobo
        duration: 180, // 6 months
        features: [
          'Career advisory',
          'Profile screening',
          'Job application feedback',
          'Profile assessment feedback',
          'Profile forwarding to employers'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: '10_plus_years',
        price: 1000000, // ₦10,000 in kobo
        duration: 180, // 6 months
        features: [
          'Career advisory',
          'Profile screening',
          'Job application feedback',
          'Profile assessment feedback',
          'Profile forwarding to employers'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'resume_download',
        price: 300000, // ₦3,000 in kobo
        duration: 365, // 12 months
        features: [
          'ATS-optimized templates',
          'Professional PDF download',
          'Expert content guidance',
          'Unlimited revisions',
          '12-month access'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'profile_forwarding_basic',
        price: 0, // Free
        duration: 365, // 1 year
        features: [
          'Update your profile anytime',
          'Appear on profile search'
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'profile_forwarding_premium',
        price: 500000, // ₦5,000 in kobo
        duration: 90, // 3 months
        features: [
          'Update your profile anytime',
          'Free profile download',
          'Appear on profile search',
          'Profile assessment feedback',
          'Forwarding your profile to potential employers for 3 months'
        ],
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the new plans
    await queryInterface.bulkDelete('plans', {
      name: {
        [Sequelize.Op.in]: [
          '0-2_years',
          '3-5_years', 
          '6-7_years',
          '10_plus_years',
          'resume_download',
          'profile_forwarding_basic',
          'profile_forwarding_premium'
        ]
      }
    }, {});
  }
}; 