#!/usr/bin/env node

require('dotenv').config();
const { sequelize } = require('./src/models');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run migrations
    console.log('🔄 Running migrations...');
    const { execSync } = require('child_process');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully.');
    
    // Run seeders (optional)
    try {
      console.log('🌱 Running seeders...');
      execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
      console.log('✅ Seeders completed successfully.');
    } catch (error) {
      console.log('⚠️  Seeders failed or no seeders found, continuing...');
    }
    
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 