'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add call_type enum to support group calls
    await queryInterface.changeColumn('calls', 'call_type', {
      type: Sequelize.ENUM('audio', 'video', 'group_audio', 'group_video'),
      allowNull: false,
      defaultValue: 'audio'
    });

    // Add group_id column for group calls if it doesn't exist
    try {
      await queryInterface.addColumn('calls', 'group_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.log('group_id column might already exist');
    }

    // Check if conversation_id column exists, if not add it
    try {
      await queryInterface.addColumn('calls', 'conversation_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('conversation_id column might already exist');
    }

    // Make receiver_id nullable for group calls
    await queryInterface.changeColumn('calls', 'receiver_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('calls', ['group_id']);
    } catch (error) {
      console.log('group_id index might already exist');
    }
    
    try {
      await queryInterface.addIndex('calls', ['conversation_id']);
    } catch (error) {
      console.log('conversation_id index might already exist');
    }
    
    try {
      await queryInterface.addIndex('calls', ['call_type']);
    } catch (error) {
      console.log('call_type index might already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('calls', 'conversation_id');
    await queryInterface.removeColumn('calls', 'group_id');

    // Revert call_type enum
    await queryInterface.changeColumn('calls', 'call_type', {
      type: Sequelize.ENUM('audio', 'video'),
      allowNull: false,
      defaultValue: 'audio'
    });

    // Revert receiver_id to not null
    await queryInterface.changeColumn('calls', 'receiver_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Remove indexes
    await queryInterface.removeIndex('calls', ['group_id']);
    await queryInterface.removeIndex('calls', ['conversation_id']);
    await queryInterface.removeIndex('calls', ['call_type']);
  }
};
