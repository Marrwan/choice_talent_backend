'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      call_id: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'call_id',
        comment: 'References either calls or group_calls table'
      },
      participants: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of participant objects with user info and participation details'
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
        allowNull: true,
        comment: 'Type of call for quick filtering'
      },
      call_quality: {
        type: Sequelize.ENUM('excellent', 'good', 'fair', 'poor'),
        allowNull: true,
        comment: 'Overall call quality rating'
      },
      ended_reason: {
        type: Sequelize.ENUM('normal', 'timeout', 'technical_issue', 'cancelled', 'interrupted'),
        allowNull: true,
        defaultValue: 'normal',
        comment: 'Reason why the call ended'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional call metadata and analytics'
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

    // Create indexes with conditional checks
    try {
    await queryInterface.addIndex('call_history', ['call_id']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index call_history_call_id already exists, skipping...');
    }
    
    try {
    await queryInterface.addIndex('call_history', ['timestamp']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index call_history_timestamp already exists, skipping...');
    }
    
    try {
    await queryInterface.addIndex('call_history', ['call_type']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index call_history_call_type already exists, skipping...');
    }
    
    try {
    await queryInterface.addIndex('call_history', ['duration']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index call_history_duration already exists, skipping...');
    }
    
    try {
    await queryInterface.addIndex('call_history', {
      fields: ['participants'],
      using: 'gin',
      name: 'call_history_participants_gin'
    });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index call_history_participants_gin already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_history');
  }
};
