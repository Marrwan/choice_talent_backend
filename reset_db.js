require('dotenv').config();
const { sequelize } = require('./src/models');

const resetDatabase = async () => {
  try {
    console.log('Starting database reset...');
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    console.log('Database has been successfully reset.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
};

resetDatabase(); 