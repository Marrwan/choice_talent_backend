'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('match_preferences', {
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
      age_min: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 18,
          max: 100
        }
      },
      age_max: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 18,
          max: 100
        }
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      marital_status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      height: {
        type: Sequelize.STRING,
        allowNull: true
      },
      complexion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      body_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      occupation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lga: {
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

    // Add index for user_id
    await queryInterface.addIndex('match_preferences', ['user_id'], {
      unique: true,
      name: 'match_preferences_user_id_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('match_preferences');
  }
}; 