'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calls', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      caller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      receiver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      call_type: {
        type: Sequelize.ENUM('audio', 'video'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ringing', 'active', 'ended', 'missed', 'declined'),
        allowNull: false,
        defaultValue: 'ringing'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      meta: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex('calls', ['caller_id']);
    await queryInterface.addIndex('calls', ['receiver_id']);
    await queryInterface.addIndex('calls', ['conversation_id']);
    await queryInterface.addIndex('calls', ['status']);
    await queryInterface.addIndex('calls', ['call_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('calls');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calls_call_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calls_status";');
  }
}; 