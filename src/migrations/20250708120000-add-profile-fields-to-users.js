"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'real_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('users', 'profile_picture', {
      type: Sequelize.STRING(1000),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'marital_status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'height', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'complexion', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'body_size', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'occupation', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'state', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'lga', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'contact_number', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'real_name');
    await queryInterface.removeColumn('users', 'username');
    await queryInterface.removeColumn('users', 'profile_picture');
    await queryInterface.removeColumn('users', 'date_of_birth');
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'marital_status');
    await queryInterface.removeColumn('users', 'height');
    await queryInterface.removeColumn('users', 'complexion');
    await queryInterface.removeColumn('users', 'body_size');
    await queryInterface.removeColumn('users', 'occupation');
    await queryInterface.removeColumn('users', 'country');
    await queryInterface.removeColumn('users', 'state');
    await queryInterface.removeColumn('users', 'lga');
    await queryInterface.removeColumn('users', 'contact_number');
  }
};
