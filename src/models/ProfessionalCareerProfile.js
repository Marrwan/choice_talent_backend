const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfessionalCareerProfile = sequelize.define('ProfessionalCareerProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      unique: true,
      comment: 'Reference to the user who owns this profile'
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture',
      comment: 'URL to profile picture'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'full_name',
      validate: {
        len: [2, 100]
      }
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['male', 'female', 'other']]
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number'
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_address',
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lgaOfResidence: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lga_of_residence'
    },
    stateOfResidence: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'state_of_residence'
    },
    professionalSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'professional_summary',
      comment: 'Professional background or personal summary'
    },
    persona: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Professional persona or soft skills/personality'
    },
    expertiseCompetencies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'expertise_competencies',
      comment: 'Areas of expertise or competencies'
    },
    softwareSkills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'software_skills',
      comment: 'Software knowledge or tools'
    },
    nyscStatus: {
      type: DataTypes.ENUM('Completed', 'Ongoing', 'Exempted', 'Not Applicable', 'Foreigner'),
      allowNull: true,
      field: 'nysc_status'
    },
    nyscCompletionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'nysc_completion_date',
      comment: 'Date when NYSC was completed (only required if status is Completed)'
    }
  }, {
    tableName: 'professional_career_profiles',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  ProfessionalCareerProfile.associate = function(models) {
    // One-to-one relationship with User
    ProfessionalCareerProfile.belongsTo(models.User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });

    // One-to-many relationships with related tables
    ProfessionalCareerProfile.hasMany(models.WorkExperience, { 
      foreignKey: 'profileId', 
      as: 'workExperiences' 
    });
    
    ProfessionalCareerProfile.hasMany(models.HigherEducation, { 
      foreignKey: 'profileId', 
      as: 'higherEducations' 
    });
    
    ProfessionalCareerProfile.hasMany(models.BasicEducation, { 
      foreignKey: 'profileId', 
      as: 'basicEducations' 
    });
    
    ProfessionalCareerProfile.hasMany(models.ProfessionalMembership, { 
      foreignKey: 'profileId', 
      as: 'professionalMemberships' 
    });
    
    ProfessionalCareerProfile.hasMany(models.TrainingCertification, { 
      foreignKey: 'profileId', 
      as: 'trainingCertifications' 
    });
    
    ProfessionalCareerProfile.hasMany(models.ReferenceDetail, { 
      foreignKey: 'profileId', 
      as: 'referenceDetails' 
    });
  };

  return ProfessionalCareerProfile;
}; 