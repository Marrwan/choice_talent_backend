'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deleted_at column to groups table
    await queryInterface.addColumn('groups', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for deleted_at
    await queryInterface.addIndex('groups', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    // Remove deleted_at column
    await queryInterface.removeColumn('groups', 'deleted_at');
  }
}; 