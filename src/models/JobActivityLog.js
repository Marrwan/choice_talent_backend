const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobActivityLog = sequelize.define('JobActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'subscription_id',
      references: {
        model: 'job_subscriptions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    activityType: {
      type: DataTypes.ENUM('profile_forwarded', 'profile_screened', 'feedback_received'),
      allowNull: false,
      field: 'activity_type'
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'company_name'
    },
    companyLocation: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'company_location'
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'job_activity_logs',
    timestamps: true,
    underscored: true,
    paranoid: false
  });

  // Set up associations
  JobActivityLog.associate = function(models) {
    // Many-to-one relationship with User
    JobActivityLog.belongsTo(models.User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });

    // Many-to-one relationship with JobSubscription
    JobActivityLog.belongsTo(models.JobSubscription, { 
      foreignKey: 'subscriptionId', 
      as: 'subscription' 
    });
  };

  return JobActivityLog;
}; 