const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailLog = sequelize.define('EmailLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id',
      references: {
        model: 'email_campaigns',
        key: 'id'
      }
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'recipient_email',
      validate: {
        isEmail: true
      }
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'recipient_name'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'bounced'),
      allowNull: false,
      defaultValue: 'pending'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'message_id',
      comment: 'Email service message ID for tracking'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'retry_count'
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_retry_at'
    }
  }, {
    tableName: 'email_logs',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      {
        fields: ['campaign_id']
      },
      {
        fields: ['recipient_email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['sent_at']
      }
    ]
  });

  // Set up associations
  EmailLog.associate = function(models) {
    // Many-to-one relationship with EmailCampaign
    EmailLog.belongsTo(models.EmailCampaign, { 
      foreignKey: 'campaignId', 
      as: 'campaign' 
    });
  };

  return EmailLog;
}; 