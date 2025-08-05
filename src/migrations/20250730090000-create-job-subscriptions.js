'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create job_subscriptions table
    await queryInterface.createTable('job_subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscription_type: {
        type: Sequelize.ENUM('0-2_years', '3-5_years', '6-7_years', '10_plus_years'),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER, // in months
        allowNull: false,
        defaultValue: 12
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_date: {
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

    // Create job_payments table
    await queryInterface.createTable('job_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      payment_method: {
        type: Sequelize.ENUM('bank_transfer', 'flutterwave', 'paystack'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      proof_of_payment: {
        type: Sequelize.STRING, // URL to uploaded proof
        allowNull: true
      },
      transaction_reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payment_date: {
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

    // Create job_activity_logs table
    await queryInterface.createTable('job_activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      activity_type: {
        type: Sequelize.ENUM('profile_forwarded', 'profile_screened', 'feedback_received'),
        allowNull: false
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
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
    await queryInterface.addIndex('job_subscriptions', ['user_id']);
    await queryInterface.addIndex('job_subscriptions', ['status']);
    await queryInterface.addIndex('job_payments', ['payment_id']);
    await queryInterface.addIndex('job_payments', ['subscription_id']);
    await queryInterface.addIndex('job_payments', ['status']);
    await queryInterface.addIndex('job_activity_logs', ['user_id']);
    await queryInterface.addIndex('job_activity_logs', ['subscription_id']);
    await queryInterface.addIndex('job_activity_logs', ['activity_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_activity_logs');
    await queryInterface.dropTable('job_payments');
    await queryInterface.dropTable('job_subscriptions');
  }
}; 