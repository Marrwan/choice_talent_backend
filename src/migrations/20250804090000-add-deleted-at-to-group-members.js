'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deleted_at column to group_members table
    await queryInterface.addColumn('group_members', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for deleted_at
    await queryInterface.addIndex('group_members', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    // Remove deleted_at column
    await queryInterface.removeColumn('group_members', 'deleted_at');
  }
}; 