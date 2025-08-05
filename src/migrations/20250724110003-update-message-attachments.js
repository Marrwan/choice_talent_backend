'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns if they don't exist
    try {
      await queryInterface.addColumn('message_attachments', 'upload_status', {
        type: Sequelize.ENUM('uploading', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'completed'
      });
    } catch (error) {
      console.log('upload_status column might already exist');
    }

    try {
      await queryInterface.addColumn('message_attachments', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    } catch (error) {
      console.log('metadata column might already exist');
    }

    // Rename existing columns to match new schema
    try {
      await queryInterface.renameColumn('message_attachments', 'file_size', 'size');
    } catch (error) {
      console.log('file_size column might already be renamed to size');
    }

    try {
      await queryInterface.renameColumn('message_attachments', 'mime_type', 'file_type');
    } catch (error) {
      console.log('mime_type column might already be renamed to file_type');
    }

    // Remove unused columns if they exist
    try {
      await queryInterface.removeColumn('message_attachments', 'file_name');
    } catch (error) {
      console.log('file_name column might not exist');
    }

    try {
      await queryInterface.removeColumn('message_attachments', 'file_path');
    } catch (error) {
      console.log('file_path column might not exist');
    }

    try {
      await queryInterface.removeColumn('message_attachments', 'thumbnail_path');
    } catch (error) {
      console.log('thumbnail_path column might not exist');
    }

    // Add new indexes
    try {
      await queryInterface.addIndex('message_attachments', ['file_type']);
    } catch (error) {
      console.log('file_type index might already exist');
    }

    try {
      await queryInterface.addIndex('message_attachments', ['size']);
    } catch (error) {
      console.log('size index might already exist');
    }

    try {
      await queryInterface.addIndex('message_attachments', ['upload_status']);
    } catch (error) {
      console.log('upload_status index might already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    try {
      await queryInterface.removeColumn('message_attachments', 'upload_status');
    } catch (error) {
      console.log('upload_status column might not exist');
    }

    try {
      await queryInterface.removeColumn('message_attachments', 'metadata');
    } catch (error) {
      console.log('metadata column might not exist');
    }

    // Rename columns back
    try {
      await queryInterface.renameColumn('message_attachments', 'size', 'file_size');
    } catch (error) {
      console.log('size column might not exist');
    }

    try {
      await queryInterface.renameColumn('message_attachments', 'file_type', 'mime_type');
    } catch (error) {
      console.log('file_type column might not exist');
    }

    // Add back removed columns
    try {
      await queryInterface.addColumn('message_attachments', 'file_name', {
        type: Sequelize.STRING,
        allowNull: false
      });
    } catch (error) {
      console.log('file_name column might already exist');
    }

    try {
      await queryInterface.addColumn('message_attachments', 'file_path', {
        type: Sequelize.STRING,
        allowNull: false
      });
    } catch (error) {
      console.log('file_path column might already exist');
    }

    try {
      await queryInterface.addColumn('message_attachments', 'thumbnail_path', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('thumbnail_path column might already exist');
    }
  }
};
