'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_calls', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participants: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'ended', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      call_type: {
        type: Sequelize.ENUM('audio', 'video'),
        allowNull: false,
        defaultValue: 'audio'
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
    await queryInterface.addIndex('group_calls', ['group_id']);
    await queryInterface.addIndex('group_calls', ['status']);
    await queryInterface.addIndex('group_calls', ['call_type']);
    await queryInterface.addIndex('group_calls', ['start_time']);
    await queryInterface.addIndex('group_calls', ['end_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_calls');
  }
};
