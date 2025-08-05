'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Drop existing call_participants table if it exists with old structure
      await queryInterface.dropTable('call_participants');
      console.log('Dropped existing call_participants table');
    } catch (error) {
      console.log('call_participants table might not exist or already correct');
    }

    // Create the new call_participants table with correct structure
    try {
      await queryInterface.createTable('call_participants', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        call_id: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'call_id',
          comment: 'References either calls or group_calls table'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          field: 'user_id',
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
          allowNull: true,
          field: 'joined_at'
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
          allowNull: true,
          comment: 'Network connection quality'
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Additional participant metadata (device info, etc.)'
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

      // Create indexes
      await queryInterface.addIndex('call_participants', ['call_id']);
      await queryInterface.addIndex('call_participants', ['user_id']);
      await queryInterface.addIndex('call_participants', {
        unique: true,
        fields: ['call_id', 'user_id'],
        name: 'unique_call_participant_new'
      });
      await queryInterface.addIndex('call_participants', ['status']);
      await queryInterface.addIndex('call_participants', ['role']);
      await queryInterface.addIndex('call_participants', ['joined_at']);

      console.log('Created new call_participants table with proper structure');
    } catch (error) {
      console.log('Error creating call_participants table:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_participants');
  }
};
