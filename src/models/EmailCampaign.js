const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailCampaign = sequelize.define('EmailCampaign', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Campaign name for identification'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email subject line'
    },
    template: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Email template content'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    targetAudience: {
      type: DataTypes.ENUM('incomplete_profiles', 'all_users', 'custom_list'),
      allowNull: false,
      defaultValue: 'incomplete_profiles'
    },
    customEmailList: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Custom list of email addresses'
    },
    emailsPerHour: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
      comment: 'Maximum emails to send per hour'
    },
    totalEmails: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of emails in campaign'
    },
    sentEmails: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of emails sent so far'
    },
    failedEmails: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of emails that failed to send'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to start the campaign'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign actually started'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the campaign completed'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'email_campaigns',
    timestamps: true,
    underscored: true,
    paranoid: false
  });

  // Set up associations
  EmailCampaign.associate = function(models) {
    // Many-to-one relationship with User (campaign creator)
    EmailCampaign.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator' 
    });

    // One-to-many relationship with EmailLog
    EmailCampaign.hasMany(models.EmailLog, { 
      foreignKey: 'campaignId', 
      as: 'emailLogs' 
    });
  };

  return EmailCampaign;
}; 