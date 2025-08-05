require('dotenv').config();
const { sequelize } = require('./src/models');

async function fixSchema() {
  try {
    console.log('Starting schema fixes...');
    
    // Fix message_attachments schema
    console.log('Fixing message_attachments table...');
    const [results] = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'message_attachments'"
    );
    
    const columns = results.map(r => r.column_name);
    console.log('Current columns:', columns);
    
    if (columns.includes('mime_type') && !columns.includes('file_type')) {
      await sequelize.query('ALTER TABLE message_attachments RENAME COLUMN mime_type TO file_type');
      console.log('✓ Renamed mime_type to file_type');
    }
    
    if (columns.includes('file_size') && !columns.includes('size')) {
      await sequelize.query('ALTER TABLE message_attachments RENAME COLUMN file_size TO size');
      console.log('✓ Renamed file_size to size');
    }
    
    // Fix call_participants table
    console.log('Fixing call_participants table...');
    try {
      await sequelize.query('DROP TABLE IF EXISTS call_participants CASCADE');
      console.log('✓ Dropped existing call_participants table');
    } catch (error) {
      console.log('No existing call_participants table to drop');
    }
    
    // Create new call_participants table
    await sequelize.query(`
      CREATE TABLE call_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        call_id UUID NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'participant',
        muted BOOLEAN NOT NULL DEFAULT false,
        video_enabled BOOLEAN NOT NULL DEFAULT true,
        joined_at TIMESTAMP WITH TIME ZONE,
        left_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'invited',
        connection_quality VARCHAR(20),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    // Create indexes
    await sequelize.query('CREATE INDEX idx_call_participants_call_id ON call_participants(call_id)');
    await sequelize.query('CREATE INDEX idx_call_participants_user_id ON call_participants(user_id)');
    await sequelize.query('CREATE INDEX idx_call_participants_status ON call_participants(status)');
    await sequelize.query('CREATE UNIQUE INDEX idx_call_participants_unique ON call_participants(call_id, user_id)');
    
    console.log('✓ Created new call_participants table');
    
    // Create call_history table
    console.log('Creating call_history table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS call_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          call_id UUID NOT NULL,
          participants JSONB NOT NULL DEFAULT '[]',
          duration INTEGER NOT NULL DEFAULT 0,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          call_type VARCHAR(20),
          call_quality VARCHAR(20),
          ended_reason VARCHAR(50) DEFAULT 'normal',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_call_history_call_id ON call_history(call_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_call_history_timestamp ON call_history(timestamp)');
      
      console.log('✓ Created call_history table');
    } catch (error) {
      console.log('Call history table might already exist');
    }
    
    console.log('Schema fixes completed successfully!');
    
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    await sequelize.close();
  }
  
  process.exit(0);
}

fixSchema();
