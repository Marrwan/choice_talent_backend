'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make migration idempotent across environments with different schema history
    const users = await queryInterface.describeTable('users');

    const columnsToRemove = [
      'interests',
      'hobbies',
      'love_language',
      'dating_profile_picture',
      'marital_status',
      'height',
      'complexion',
      'body_size',
    ];

    for (const column of columnsToRemove) {
      if (users[column]) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn('users', column);
      }
    }

    // Drop dating-related tables if they exist
    // Using raw SQL for IF EXISTS to avoid throwing when table is missing
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "match_preferences" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "date_plans" CASCADE;');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate on down only if missing
    const users = await queryInterface.describeTable('users');

    const ensureColumn = async (name, definition) => {
      if (!users[name]) {
        await queryInterface.addColumn('users', name, definition);
      }
    };

    await ensureColumn('interests', { type: Sequelize.TEXT, allowNull: true, comment: 'User interests stored as text' });
    await ensureColumn('hobbies', { type: Sequelize.TEXT, allowNull: true, comment: 'User hobbies stored as text' });
    await ensureColumn('love_language', { type: Sequelize.STRING, allowNull: true, comment: 'User love language preference' });
    await ensureColumn('dating_profile_picture', { type: Sequelize.STRING, allowNull: true, comment: 'Profile picture for dating module' });
    await ensureColumn('marital_status', { type: Sequelize.STRING, allowNull: true });
    await ensureColumn('height', { type: Sequelize.STRING, allowNull: true });
    await ensureColumn('complexion', { type: Sequelize.STRING, allowNull: true });
    await ensureColumn('body_size', { type: Sequelize.STRING, allowNull: true });

    // Recreate dating-related tables only if not exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'match_preferences'
        ) THEN
          CREATE TABLE "match_preferences" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            "createdAt" TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP NOT NULL
          );
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'date_plans'
        ) THEN
          CREATE TABLE "date_plans" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            "createdAt" TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP NOT NULL
          );
        END IF;
      END $$;
    `);
  }
};
