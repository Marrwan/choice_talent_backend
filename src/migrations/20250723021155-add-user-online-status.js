'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'is_online', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'last_seen', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Create index for efficient online user queries
    await queryInterface.addIndex('users', ['is_online'], {
      name: 'idx_users_is_online'
    });

    await queryInterface.addIndex('users', ['last_seen'], {
      name: 'idx_users_last_seen'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'idx_users_last_seen');
    await queryInterface.removeIndex('users', 'idx_users_is_online');
    await queryInterface.removeColumn('users', 'last_seen');
    await queryInterface.removeColumn('users', 'is_online');
  }
};
