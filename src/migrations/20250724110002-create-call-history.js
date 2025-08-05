'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('call_history')
    );
    
    if (tableExists) {
      console.log('call_history table already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('call_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      call_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'References either calls or group_calls table'
      },
      participants: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Call duration in seconds'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      call_type: {
        type: Sequelize.ENUM('audio', 'video', 'group_audio', 'group_video'),
        allowNull: true
      },
      call_quality: {
        type: Sequelize.ENUM('excellent', 'good', 'fair', 'poor'),
        allowNull: true
      },
      ended_reason: {
        type: Sequelize.ENUM('normal', 'timeout', 'technical_issue', 'cancelled', 'interrupted'),
        allowNull: true,
        defaultValue: 'normal'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('call_history', ['call_id']);
    await queryInterface.addIndex('call_history', ['timestamp']);
    await queryInterface.addIndex('call_history', ['call_type']);
    await queryInterface.addIndex('call_history', ['duration']);
    
    // Add GIN index for JSONB participants column for efficient searching
    await queryInterface.addIndex('call_history', ['participants'], {
      using: 'gin',
      name: 'call_history_participants_gin'
    });
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('call_history')
    );
    
    if (tableExists) {
      await queryInterface.dropTable('call_history');
    }
  }
};
