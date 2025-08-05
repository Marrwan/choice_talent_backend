'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_participants', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
      call_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('invited', 'ringing', 'connected', 'disconnected', 'declined'),
        defaultValue: 'invited',
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_video_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('call_participants', ['conversation_id']);
    await queryInterface.addIndex('call_participants', ['user_id']);
    await queryInterface.addIndex('call_participants', ['call_id']);
    await queryInterface.addIndex('call_participants', ['status']);
    await queryInterface.addIndex('call_participants', ['conversation_id', 'call_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_participants');
    
    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_call_participants_status";');
  }
};
