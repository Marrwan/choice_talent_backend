const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkExperience = sequelize.define('WorkExperience', {
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
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'company_name',
      validate: {
        len: [2, 100]
      }
    },
    companyLocation: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'company_location'
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'entry_date'
    },
    exitDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'exit_date'
    },
    isCurrentJob: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_current_job',
      comment: 'Indicates if this is the current job (exit date will be null)'
    },
    jobDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'job_description'
    },
    achievements: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employerOrSupervisorName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'employer_or_supervisor_name',
      comment: 'Name of employer or supervisor for reference purposes'
    },
    officialPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'official_phone',
      comment: 'Official phone number for reference purposes'
    },
    officialEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'official_email',
      comment: 'Official email address for reference purposes'
    }
  }, {
    tableName: 'work_experiences',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
    defaultScope: {
      attributes: { exclude: ['profile_id'] }
    }
  });

  // Set up associations
  WorkExperience.associate = function(models) {
    WorkExperience.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile',
      scope: {
        attributes: { exclude: ['profile_id'] }
      }
    });
  };

  return WorkExperience;
}; 