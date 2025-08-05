'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Main Professional Career Profile table
    await queryInterface.createTable('professional_career_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      profile_picture: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL to profile picture'
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lga_of_residence: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state_of_residence: {
        type: Sequelize.STRING,
        allowNull: true
      },
      professional_summary: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Professional background or personal summary'
      },
      persona: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Professional persona or soft skills/personality'
      },
      expertise_competencies: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Areas of expertise or competencies'
      },
      software_skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Software knowledge or tools'
      },
      nysc_status: {
        type: Sequelize.ENUM('Yes', 'No', 'Ongoing', 'Exempted'),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Work Experience table
    await queryInterface.createTable('work_experiences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      exit_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      job_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      achievements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Higher Education table
    await queryInterface.createTable('higher_educations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      institution_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      course_of_study: {
        type: Sequelize.STRING,
        allowNull: false
      },
      qualification: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entry_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      graduation_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Secondary & Primary Education table
    await queryInterface.createTable('basic_educations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      school_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      certification: {
        type: Sequelize.STRING,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      education_type: {
        type: Sequelize.ENUM('Primary', 'Secondary'),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Professional Memberships table
    await queryInterface.createTable('professional_memberships', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      professional_body_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      year_of_joining: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Training & Certification table
    await queryInterface.createTable('training_certifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      training_organization: {
        type: Sequelize.STRING,
        allowNull: false
      },
      certification_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date_of_certification: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Reference Details table
    await queryInterface.createTable('reference_details', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'professional_career_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      referee_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      occupation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('professional_career_profiles', ['user_id']);
    await queryInterface.addIndex('work_experiences', ['profile_id']);
    await queryInterface.addIndex('higher_educations', ['profile_id']);
    await queryInterface.addIndex('basic_educations', ['profile_id']);
    await queryInterface.addIndex('professional_memberships', ['profile_id']);
    await queryInterface.addIndex('training_certifications', ['profile_id']);
    await queryInterface.addIndex('reference_details', ['profile_id']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('reference_details');
    await queryInterface.dropTable('training_certifications');
    await queryInterface.dropTable('professional_memberships');
    await queryInterface.dropTable('basic_educations');
    await queryInterface.dropTable('higher_educations');
    await queryInterface.dropTable('work_experiences');
    await queryInterface.dropTable('professional_career_profiles');
  }
}; 