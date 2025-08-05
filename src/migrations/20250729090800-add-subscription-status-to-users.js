'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'subscription_status', {
      type: Sequelize.ENUM('free', 'premium'),
      allowNull: false,
      defaultValue: 'free',
      comment: 'User subscription status: free or premium'
    });

    await queryInterface.addColumn('users', 'last_upgrade_reminder', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Last time upgrade reminder was sent'
    });

    await queryInterface.addColumn('users', 'upgrade_reminder_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of upgrade reminders sent'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'subscription_status');
    await queryInterface.removeColumn('users', 'last_upgrade_reminder');
    await queryInterface.removeColumn('users', 'upgrade_reminder_count');
  }
}; 