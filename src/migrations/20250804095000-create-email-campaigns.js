'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Campaign name for identification'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email subject line'
      },
      template: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Email template content'
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      target_audience: {
        type: Sequelize.ENUM('incomplete_profiles', 'all_users', 'custom_list'),
        allowNull: false,
        defaultValue: 'incomplete_profiles'
      },
      custom_email_list: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Custom list of email addresses'
      },
      emails_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
        comment: 'Maximum emails to send per hour'
      },
      total_emails: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of emails in campaign'
      },
      sent_emails: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of emails sent so far'
      },
      failed_emails: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of emails that failed to send'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to start the campaign'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the campaign actually started'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the campaign completed'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('email_campaigns', ['status']);
    await queryInterface.addIndex('email_campaigns', ['target_audience']);
    await queryInterface.addIndex('email_campaigns', ['scheduled_at']);
    await queryInterface.addIndex('email_campaigns', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_campaigns');
  }
}; 