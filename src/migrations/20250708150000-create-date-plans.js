'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('date_plans', {
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
      budget: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Budget for the planned date'
      },
      expectations: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User expectations for the date'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
        comment: 'Status of the date plan request'
      },
      planned_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Planned date and time for the event'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Suggested location for the date'
      },
      suggestions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Professional suggestions from the planning team'
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
    await queryInterface.addIndex('date_plans', ['user_id'], {
      name: 'date_plans_user_id_index'
    });

    await queryInterface.addIndex('date_plans', ['status'], {
      name: 'date_plans_status_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('date_plans');
  }
}; 