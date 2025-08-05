'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'interests', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User interests stored as text'
    });

    await queryInterface.addColumn('users', 'hobbies', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User hobbies stored as text'
    });

    await queryInterface.addColumn('users', 'love_language', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'User love language preference'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'interests');
    await queryInterface.removeColumn('users', 'hobbies');
    await queryInterface.removeColumn('users', 'love_language');
  }
}; 