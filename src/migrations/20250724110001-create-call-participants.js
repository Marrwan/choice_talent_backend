'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      call_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'References either calls or group_calls table'
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
      role: {
        type: Sequelize.ENUM('host', 'moderator', 'participant'),
        allowNull: false,
        defaultValue: 'participant'
      },
      muted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      video_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('invited', 'joined', 'declined', 'missed', 'left'),
        allowNull: false,
        defaultValue: 'invited'
      },
      connection_quality: {
        type: Sequelize.ENUM('excellent', 'good', 'fair', 'poor'),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('call_participants', ['call_id']);
    await queryInterface.addIndex('call_participants', ['user_id']);
    await queryInterface.addIndex('call_participants', ['call_id', 'user_id'], { 
      unique: true,
      name: 'unique_call_participant'
    });
    await queryInterface.addIndex('call_participants', ['status']);
    await queryInterface.addIndex('call_participants', ['role']);
    await queryInterface.addIndex('call_participants', ['joined_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_participants');
  }
};
