const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReferenceDetail = sequelize.define('ReferenceDetail', {
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
    refereeName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'referee_name',
      validate: {
        len: [2, 100]
      }
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contact_number'
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_address',
      validate: {
        isEmail: true
      }
    }
  }, {
    tableName: 'reference_details',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  ReferenceDetail.associate = function(models) {
    ReferenceDetail.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile' 
    });
  };

  return ReferenceDetail;
}; 