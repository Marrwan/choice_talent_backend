'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint from conversations to messages
    await queryInterface.addConstraint('conversations', {
      fields: ['last_message_id'],
      type: 'foreign key',
      name: 'fk_conversations_last_message',
      references: {
        table: 'messages',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('conversations', 'fk_conversations_last_message');
  }
}; 