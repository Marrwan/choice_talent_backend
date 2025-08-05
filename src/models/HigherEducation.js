const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HigherEducation = sequelize.define('HigherEducation', {
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
    institutionName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'institution_name',
      validate: {
        len: [2, 100]
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    courseOfStudy: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'course_of_study',
      validate: {
        len: [2, 100]
      }
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    entryYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'entry_year',
      validate: {
        min: 1900,
        max: new Date().getFullYear()
      }
    },
    graduationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'graduation_year',
      validate: {
        min: 1900,
        max: new Date().getFullYear() + 10
      }
    }
  }, {
    tableName: 'higher_educations',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  HigherEducation.associate = function(models) {
    HigherEducation.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile' 
    });
  };

  return HigherEducation;
}; 