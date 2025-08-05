'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_members', {
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
        type: Sequelize.ENUM('admin', 'member'),
        defaultValue: 'member',
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      left_at: {
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

    // Add indexes
    await queryInterface.addIndex('group_members', ['group_id']);
    await queryInterface.addIndex('group_members', ['user_id']);
    await queryInterface.addIndex('group_members', ['group_id', 'user_id'], { unique: false });
    await queryInterface.addIndex('group_members', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_members');
  }
};
