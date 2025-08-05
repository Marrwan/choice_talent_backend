'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make participant columns nullable for group conversations
    await queryInterface.changeColumn('conversations', 'participant1_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('conversations', 'participant2_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Check if the column 'type' already exists
    const columnExists = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='conversations' AND column_name='type';
    `);

    // Add new columns for group support if they don't exist
    if (columnExists[0].length === 0) {
    await queryInterface.addColumn('conversations', 'type', {
      type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      });
    }

    // Change group_id to UUID to match the groups table
    await queryInterface.addColumn('conversations', 'group_id', {
      type: Sequelize.UUID, // Change this to UUID
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('conversations', 'name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add index for better performance
    await queryInterface.addIndex('conversations', ['type']);
    await queryInterface.addIndex('conversations', ['group_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('conversations', 'description');
    await queryInterface.removeColumn('conversations', 'name');
    await queryInterface.removeColumn('conversations', 'group_id');
    await queryInterface.removeColumn('conversations', 'type');

    // Revert participant columns to not null
    await queryInterface.changeColumn('conversations', 'participant1_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('conversations', 'participant2_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Remove indexes
    await queryInterface.removeIndex('conversations', ['type']);
    await queryInterface.removeIndex('conversations', ['group_id']);
  }
};
