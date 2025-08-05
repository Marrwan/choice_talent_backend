'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_hunting_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
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
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        field: 'job_types',
        comment: 'Array of selected job types (Remote, Freelance, Part-time, etc.)'
      },
      careerCategory: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'career_category',
        comment: 'Selected career category (Entry-Level, Experienced, etc.)'
      },
      categoryOfPositions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        field: 'category_of_positions',
        comment: 'Array of selected position categories'
      },
      totalYearsOfWorkExperience: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'total_years_of_work_experience',
        comment: 'Selected years of work experience range'
      },
      preferredLocations: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        field: 'preferred_locations',
        comment: 'Array of preferred Nigerian states and FCT'
      },
      minimumSalaryExpectation: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'minimum_salary_expectation',
        comment: 'Minimum salary expectation as text'
      },
      workWithProposedPay: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'work_with_proposed_pay',
        comment: 'Whether user will work with employer proposed pay'
      },
      salaryExpectationNegotiable: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'salary_expectation_negotiable',
        validate: {
          isIn: [['Yes', 'No']]
        },
        comment: 'Whether salary expectation is negotiable'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    // Add indexes
    await queryInterface.addIndex('job_hunting_settings', ['user_id']);
    await queryInterface.addIndex('job_hunting_settings', ['career_category']);
    await queryInterface.addIndex('job_hunting_settings', ['total_years_of_work_experience']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_hunting_settings');
  }
}; 