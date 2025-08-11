'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove dating-related columns from users table
    await queryInterface.removeColumn('users', 'interests');
    await queryInterface.removeColumn('users', 'hobbies');
    await queryInterface.removeColumn('users', 'love_language');
    await queryInterface.removeColumn('users', 'dating_profile_picture');
    await queryInterface.removeColumn('users', 'marital_status');
    await queryInterface.removeColumn('users', 'height');
    await queryInterface.removeColumn('users', 'complexion');
    await queryInterface.removeColumn('users', 'body_size');

    // Drop dating-related tables
    await queryInterface.dropTable('match_preferences');
    await queryInterface.dropTable('date_plans');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate dating-related columns in users table
    await queryInterface.addColumn('users', 'interests', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User interests stored as text'
    });
    await queryInterface.addColumn('users', 'hobbies', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User hobbies stored as text'
    });
    await queryInterface.addColumn('users', 'love_language', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'User love language preference'
    });
    await queryInterface.addColumn('users', 'dating_profile_picture', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Profile picture for dating module'
    });
    await queryInterface.addColumn('users', 'marital_status', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'height', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'complexion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'body_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Recreate dating-related tables (simplified structure)
    await queryInterface.createTable('match_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('date_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }
};
