"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    const userFields = {
      real_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      profile_picture: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      marital_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      height: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      complexion: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      body_size: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      occupation: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      lga: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    };

    for (const field in userFields) {
      if (!columns[field]) {
        await queryInterface.addColumn('users', field, userFields[field]);
      }
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('users');
    const userFields = {
      real_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      profile_picture: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      marital_status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      height: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      complexion: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      body_size: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      occupation: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      lga: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    };

    for (const field in userFields) {
      if (columns[field]) {
        await queryInterface.removeColumn('users', field);
      }
    }
  }
};
