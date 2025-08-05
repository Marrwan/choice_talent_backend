'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('message_attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnail_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('message_attachments', ['message_id']);
    await queryInterface.addIndex('message_attachments', ['uploaded_by']);
    await queryInterface.addIndex('message_attachments', ['mime_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('message_attachments');
  }
}; 