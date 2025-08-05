const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfessionalMembership = sequelize.define('ProfessionalMembership', {
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
    professionalBodyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'professional_body_name',
      validate: {
        len: [2, 100]
      }
    },
    yearOfJoining: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'year_of_joining',
      validate: {
        min: 1900,
        max: new Date().getFullYear()
      }
    }
  }, {
    tableName: 'professional_memberships',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  ProfessionalMembership.associate = function(models) {
    ProfessionalMembership.belongsTo(models.ProfessionalCareerProfile, { 
      foreignKey: 'profileId', 
      as: 'profile' 
    });
  };

  return ProfessionalMembership;
}; 