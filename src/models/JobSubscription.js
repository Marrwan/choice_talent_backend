const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobSubscription = sequelize.define('JobSubscription', {
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
    subscriptionType: {
      type: DataTypes.ENUM('0-2_years', '3-5_years', '6-7_years', '10_plus_years'),
      allowNull: false,
      field: 'subscription_type'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // in months
      allowNull: false,
      defaultValue: 12
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date'
    }
  }, {
    tableName: 'job_subscriptions',
    timestamps: true,
    underscored: true,
    paranoid: false
  });

  // Set up associations
  JobSubscription.associate = function(models) {
    // One-to-one relationship with User
    JobSubscription.belongsTo(models.User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });

    // One-to-many relationship with JobPayment
    JobSubscription.hasMany(models.JobPayment, { 
      foreignKey: 'subscriptionId', 
      as: 'payments' 
    });

    // One-to-many relationship with JobActivityLog
    JobSubscription.hasMany(models.JobActivityLog, { 
      foreignKey: 'subscriptionId', 
      as: 'activityLogs' 
    });
  };

  return JobSubscription;
}; 