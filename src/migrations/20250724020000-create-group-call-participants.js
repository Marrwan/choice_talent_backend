'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_call_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      call_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'calls',
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
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('ringing', 'connected', 'declined', 'missed', 'left'),
        defaultValue: 'ringing',
        allowNull: false
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
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('group_call_participants', ['call_id']);
    await queryInterface.addIndex('group_call_participants', ['user_id']);
    await queryInterface.addIndex('group_call_participants', ['call_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('group_call_participants', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_call_participants');
  }
};
