const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobHuntingSettings = sequelize.define('JobHuntingSettings', {
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
      comment: 'Reference to the user who owns these job hunting settings'
    },
    jobTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'job_types',
      validate: {
        isValidJobTypes(value) {
          if (value && Array.isArray(value)) {
            const validJobTypes = [
              'Remote Jobs',
              'Freelance Jobs',
              'Part-time Jobs',
              'Full-time Jobs',
              'Contract Jobs',
              'Volunteer Jobs'
            ];
            const invalidTypes = value.filter(type => !validJobTypes.includes(type));
            if (invalidTypes.length > 0) {
              throw new Error(`Invalid job types: ${invalidTypes.join(', ')}`);
            }
          }
        }
      },
      comment: 'Array of selected job types (Remote, Freelance, Part-time, etc.)'
    },
    careerCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'career_category',
      validate: {
        isIn: {
          args: [[
            'Undergraduate Internship',
            'Graduate Trainee / Interns',
            'Entry-Level',
            'Intermediate Level',
            'Experienced Level',
            'Senior Level',
            'Supervisory Level',
            'Management Level',
            'Executive Level'
          ]],
          msg: 'Invalid career category'
        }
      },
      comment: 'Selected career category (Entry-Level, Experienced, etc.)'
    },
    categoryOfPositions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'category_of_positions',
      comment: 'Array of selected position categories'
    },
    totalYearsOfWorkExperience: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'total_years_of_work_experience',
      // validate: {
      //   isIn: {
      //     args: [
      //       '0 - 1 Years of work experience',
      //       '2 Years of work experience',
      //       '3 Years of work experience',
      //       '4 Years of work experience',
      //       '5 Years of work experience',
      //       '6 Years of work experience',
      //       '7 Years of work experience',
      //       '8 Years of work experience',
      //       '9 Years of work experience',
      //       '10 Years of work experience',
      //       '11 Years of work experience',
      //       '12 Years of work experience',
      //       '13 Years of work experience',
      //       '14 Years of work experience',
      //       '15 Years of work experience',
      //       '16 Years of work experience',
      //       '17 Years of work experience',
      //       '18 Years of work experience',
      //       '19 Years of work experience',
      //       '20 Years of work experience',
      //       '21 Years of work experience',
      //       '22 Years of work experience',
      //       '23 Years of work experience',
      //       '24 Years of work experience',
      //       '25 Years of work experience',
      //       '26 Years of work experience',
      //       '27 Years of work experience',
      //       '28 Years of work experience',
      //       '29 Years of work experience',
      //       '30 Years of work experience',
      //       '31 Years of work experience',
      //       '32 Years of work experience',
      //       '33 Years of work experience',
      //       '34 Years of work experience',
      //       '35 Years of work experience and above'
      //     ],
      //     msg: 'Invalid years of work experience'
      //   }
      // },
      comment: 'Selected years of work experience range'
    },
    preferredLocations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'preferred_locations',
      validate: {
        isValidLocations(value) {
          if (value && Array.isArray(value)) {
            const validLocations = [
              'Abia State',
              'Adamawa State',
              'Akwa Ibom State',
              'Anambra State',
              'Bauchi State',
              'Bayelsa State',
              'Benue State',
              'Borno State',
              'Cross Rivers State',
              'Delta State',
              'Ebonyi State',
              'Edo State',
              'Ekiti State',
              'Enugu State',
              'Gombe State',
              'Imo State',
              'Jigawa State',
              'Kaduna State',
              'Kano State',
              'Katsina State',
              'Kebbi State',
              'Kogi State',
              'Kwara State',
              'Lagos State',
              'Nasarawa State',
              'Niger State',
              'Ogun State',
              'Ondo State',
              'Osun State',
              'Oyo State',
              'Plateau State',
              'Rivers State',
              'Sokoto State',
              'Taraba State',
              'Yobe State',
              'Zamfara State',
              'Abuja (FCT)'
            ];
            const invalidLocations = value.filter(location => !validLocations.includes(location));
            if (invalidLocations.length > 0) {
              throw new Error(`Invalid locations: ${invalidLocations.join(', ')}`);
            }
          }
        }
      },
      comment: 'Array of preferred Nigerian states and FCT'
    },
    minimumSalaryExpectation: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'minimum_salary_expectation',
      comment: 'Minimum salary expectation as text'
    },
    workWithProposedPay: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'work_with_proposed_pay',
      comment: 'Whether user will work with employer proposed pay'
    },
    salaryExpectationNegotiable: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'salary_expectation_negotiable',
      validate: {
        isIn: {
          args: [['Yes', 'No']],
          msg: 'Salary expectation negotiable must be either "Yes" or "No"'
        }
      },
      comment: 'Whether salary expectation is negotiable'
    }
  }, {
    tableName: 'job_hunting_settings',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes for this model
  });

  // Set up associations
  JobHuntingSettings.associate = function(models) {
    // One-to-one relationship with User
    JobHuntingSettings.belongsTo(models.User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });
  };

  return JobHuntingSettings;
}; 