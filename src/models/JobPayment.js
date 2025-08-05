const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobPayment = sequelize.define('JobPayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    paymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'payment_id'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'flutterwave', 'paystack'),
      allowNull: false,
      field: 'payment_method'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    proofOfPayment: {
      type: DataTypes.STRING, // URL to uploaded proof
      allowNull: true,
      field: 'proof_of_payment'
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'transaction_reference'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_date'
    }
  }, {
    tableName: 'job_payments',
    timestamps: true,
    underscored: true,
    paranoid: false
  });

  // Set up associations
  JobPayment.associate = function(models) {
    // Many-to-one relationship with JobSubscription
    JobPayment.belongsTo(models.JobSubscription, { 
      foreignKey: 'subscriptionId', 
      as: 'subscription' 
    });
  };

  return JobPayment;
}; 