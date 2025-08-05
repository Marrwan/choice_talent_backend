'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if file_type column exists, if not rename mime_type to file_type
    try {
      const tableInfo = await queryInterface.describeTable('message_attachments');
      
      if (!tableInfo.file_type && tableInfo.mime_type) {
        await queryInterface.renameColumn('message_attachments', 'mime_type', 'file_type');
        console.log('Renamed mime_type to file_type');
      }
      
      if (!tableInfo.size && tableInfo.file_size) {
        await queryInterface.renameColumn('message_attachments', 'file_size', 'size');
        console.log('Renamed file_size to size');
      }
      
      // Add missing columns if they don't exist
      if (!tableInfo.upload_status) {
        await queryInterface.addColumn('message_attachments', 'upload_status', {
          type: Sequelize.ENUM('uploading', 'completed', 'failed'),
          allowNull: false,
          defaultValue: 'completed'
        });
        console.log('Added upload_status column');
      }
      
      if (!tableInfo.metadata) {
        await queryInterface.addColumn('message_attachments', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: true
        });
        console.log('Added metadata column');
      }
      
      // Update existing records to have proper structure
      if (tableInfo.file_name && !tableInfo.original_name) {
        await queryInterface.renameColumn('message_attachments', 'file_name', 'original_name');
        console.log('Renamed file_name to original_name');
      }
      
      // Remove unused columns if they exist
      if (tableInfo.file_path) {
        await queryInterface.removeColumn('message_attachments', 'file_path');
        console.log('Removed file_path column');
      }
      
      if (tableInfo.thumbnail_path) {
        await queryInterface.removeColumn('message_attachments', 'thumbnail_path');
        console.log('Removed thumbnail_path column');
      }
      
    } catch (error) {
      console.log('Migration error handled:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    try {
      const tableInfo = await queryInterface.describeTable('message_attachments');
      
      if (!tableInfo.mime_type && tableInfo.file_type) {
        await queryInterface.renameColumn('message_attachments', 'file_type', 'mime_type');
      }
      
      if (!tableInfo.file_size && tableInfo.size) {
        await queryInterface.renameColumn('message_attachments', 'size', 'file_size');
      }
      
      if (tableInfo.upload_status) {
        await queryInterface.removeColumn('message_attachments', 'upload_status');
      }
      
      if (tableInfo.metadata) {
        await queryInterface.removeColumn('message_attachments', 'metadata');
      }
      
    } catch (error) {
      console.log('Rollback error handled:', error.message);
    }
  }
};
