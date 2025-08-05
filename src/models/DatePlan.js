const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DatePlan = sequelize.define('DatePlan', {
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
    budget: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Budget for the planned date'
    },
    expectations: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User expectations for the date'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Status of the date plan request'
    },
    plannedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'planned_date',
      comment: 'Planned date and time for the event'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Suggested location for the date'
    },
    suggestions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Professional suggestions from the planning team'
    }
  }, {
    tableName: 'date_plans',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Define associations
  DatePlan.associate = (models) => {
    DatePlan.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return DatePlan;
}; 