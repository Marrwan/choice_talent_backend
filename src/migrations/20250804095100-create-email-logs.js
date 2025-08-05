'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'email_campaigns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recipient_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      recipient_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'bounced'),
        allowNull: false,
        defaultValue: 'pending'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      message_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Email service message ID for tracking'
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('email_logs', ['campaign_id']);
    await queryInterface.addIndex('email_logs', ['recipient_email']);
    await queryInterface.addIndex('email_logs', ['status']);
    await queryInterface.addIndex('email_logs', ['sent_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_logs');
  }
}; 