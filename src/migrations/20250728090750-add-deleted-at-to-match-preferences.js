'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('match_preferences', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('match_preferences', 'deleted_at');
  }
};
