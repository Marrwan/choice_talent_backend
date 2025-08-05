'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      participant1_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant2_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      last_message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
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

    // Add unique constraint for participant pairs
    await queryInterface.addConstraint('conversations', {
      fields: ['participant1_id', 'participant2_id'],
      type: 'unique',
      name: 'unique_participants'
    });

    // Add indexes
    await queryInterface.addIndex('conversations', ['participant1_id']);
    await queryInterface.addIndex('conversations', ['participant2_id']);
    await queryInterface.addIndex('conversations', ['last_message_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
}; 