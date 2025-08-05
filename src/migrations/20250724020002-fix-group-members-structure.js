'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns that are in the model but not in the original migration
    try {
      // First add the column as nullable
      await queryInterface.addColumn('group_members', 'added_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.log('Column added_by might already exist');
    }

    try {
      await queryInterface.addColumn('group_members', 'can_add_members', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column can_add_members might already exist');
    }

    try {
      await queryInterface.addColumn('group_members', 'can_edit_group_info', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column can_edit_group_info might already exist');
    }

    // Fix groups table to match model
    try {
      await queryInterface.addColumn('groups', 'max_members', {
        type: Sequelize.INTEGER,
        defaultValue: 256
      });
    } catch (error) {
      console.log('Column max_members might already exist');  
    }

    try {
      await queryInterface.addColumn('groups', 'is_archived', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column is_archived might already exist');
    }

    // Remove is_active column from groups if it exists (replaced by is_archived)
    try {
      await queryInterface.removeColumn('groups', 'is_active');
    } catch (error) {
      console.log('Column is_active might not exist');
    }

    // Remove is_active column from group_members if it exists
    try {
      await queryInterface.removeColumn('group_members', 'is_active');
    } catch (error) {
      console.log('Column is_active might not exist');
    }

    // Add index for added_by
    try {
      await queryInterface.addIndex('group_members', ['added_by']);
    } catch (error) {
      console.log('Index for added_by might already exist');
    }

    // Update existing group members to set added_by to the group creator
    await queryInterface.sequelize.query(`
      UPDATE group_members 
      SET added_by = (
        SELECT created_by 
        FROM groups 
        WHERE groups.id = group_members.group_id
      )
      WHERE added_by IS NULL OR added_by = user_id;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('group_members', 'can_edit_group_info');
    await queryInterface.removeColumn('group_members', 'can_add_members');
    await queryInterface.removeColumn('group_members', 'added_by');
    await queryInterface.removeColumn('groups', 'is_archived');
    await queryInterface.removeColumn('groups', 'max_members');
    
    // Add back is_active columns
    await queryInterface.addColumn('groups', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    
    await queryInterface.addColumn('group_members', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
  }
};
