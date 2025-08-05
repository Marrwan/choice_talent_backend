const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      unique: true, // A user can only have one active subscription
      comment: 'The user who owns this subscription.'
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'plans',
        key: 'id',
      },
      comment: 'The plan this subscription is for.'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'The date and time when the subscription expires.'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'The current status of the subscription.'
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
  });

  return Subscription;
}; 