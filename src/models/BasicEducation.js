const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BasicEducation = sequelize.define('BasicEducation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'profile_id',
      references: {
        model: 'professional_career_profiles',
        key: 'id',
      },
      comment: 'Reference to the professional career profile'
    },
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'school_name',
      validate: {
        len: [2, 100]
      }
    },
    certification: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1900,
        max: new Date().getFullYear()
      }
    },
    educationType: {
      type: DataTypes.ENUM('Primary', 'Secondary'),
      allowNull: false,
      field: 'education_type'
    }
  }, {
    tableName: 'basic_educations',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  BasicEducation.associate = function(models) {
    BasicEducation.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile' 
    });
  };

  return BasicEducation;
}; 