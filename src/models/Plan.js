const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Name of the subscription plan (e.g., "Basic", "Premium").'
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Price in the smallest currency unit (e.g., kobo for NGN).'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration of the plan in days.'
    },
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      comment: 'List of features included in the plan.'
    },
  }, {
    tableName: 'plans',
    timestamps: true,
    underscored: true,
    paranoid: false, // Override global paranoid setting
  });

  return Plan;
}; 