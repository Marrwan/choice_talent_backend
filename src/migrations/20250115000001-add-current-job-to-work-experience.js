'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_experiences', 'is_current_job', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if this is the current job (exit date will be null)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('work_experiences', 'is_current_job');
  }
};
