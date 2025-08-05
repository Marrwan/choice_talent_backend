const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingCertification = sequelize.define('TrainingCertification', {
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
    trainingOrganization: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'training_organization',
      validate: {
        len: [2, 100]
      }
    },
    certificationName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'certification_name',
      validate: {
        len: [2, 100]
      }
    },
    dateOfCertification: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_certification'
    }
  }, {
    tableName: 'training_certifications',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  TrainingCertification.associate = function(models) {
    TrainingCertification.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile' 
    });
  };

  return TrainingCertification;
}; 