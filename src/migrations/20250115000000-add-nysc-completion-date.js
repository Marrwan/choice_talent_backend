'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('professional_career_profiles', 'nysc_completion_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Date when NYSC was completed (only required if status is Completed)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('professional_career_profiles', 'nysc_completion_date');
  }
};
