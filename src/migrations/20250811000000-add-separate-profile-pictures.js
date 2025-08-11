'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'career_profile_picture', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Profile picture for career module'
    });

    await queryInterface.addColumn('users', 'dating_profile_picture', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Profile picture for dating module'
    });

    // Copy existing profile picture to both new fields for existing users
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET career_profile_picture = profile_picture, 
          dating_profile_picture = profile_picture 
      WHERE profile_picture IS NOT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'career_profile_picture');
    await queryInterface.removeColumn('users', 'dating_profile_picture');
  }
}; 