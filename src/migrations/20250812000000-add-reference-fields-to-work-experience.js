'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add employer_or_supervisor_name field
    await queryInterface.addColumn('work_experiences', 'employer_or_supervisor_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of employer or supervisor for reference purposes'
    });

    // Add official_phone field
    await queryInterface.addColumn('work_experiences', 'official_phone', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Official phone number for reference purposes'
    });

    // Add official_email field
    await queryInterface.addColumn('work_experiences', 'official_email', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Official email address for reference purposes'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('work_experiences', 'employer_or_supervisor_name');
    await queryInterface.removeColumn('work_experiences', 'official_phone');
    await queryInterface.removeColumn('work_experiences', 'official_email');
  }
};
