const { MatchPreference, User } = require('./src/models');

async function testSoftDeletes() {
  try {
    console.log('Testing MatchPreference soft deletes...');
    
    // First, let's create a test user if one doesn't exist
    const [testUser] = await User.findOrCreate({
      where: { email: 'test-soft-delete@example.com' },
      defaults: {
        email: 'test-soft-delete@example.com',
        passwordHash: 'hashedpassword',
        name: 'Test User'
      }
    });
    
    console.log('Created/found test user:', testUser.id);
    
    // Create a test match preference
    const matchPreference = await MatchPreference.create({
      userId: testUser.id,
      ageMin: 25,
      ageMax: 35,
      gender: 'female',
      country: 'Nigeria'
    });
    
    console.log('Created match preference:', matchPreference.id);
    
    // Verify it appears in normal queries
    const allPreferences = await MatchPreference.findAll();
    console.log('All preferences (before delete):', allPreferences.length);
    
    // Soft delete the preference
    await matchPreference.destroy();
    console.log('Soft deleted match preference');
    
    // Verify it doesn't appear in normal queries (paranoid mode should exclude it)
    const allPreferencesAfterDelete = await MatchPreference.findAll();
    console.log('All preferences (after soft delete):', allPreferencesAfterDelete.length);
    
    // Verify it appears when including deleted records
    const allIncludingDeleted = await MatchPreference.findAll({ paranoid: false });
    console.log('All preferences (including deleted):', allIncludingDeleted.length);
    
    // Find the deleted record specifically
    const deletedPreference = await MatchPreference.findByPk(matchPreference.id, { paranoid: false });
    console.log('Deleted preference deleted_at:', deletedPreference?.deletedAt);
    
    // Clean up
    await matchPreference.destroy({ force: true }); // Hard delete
    await testUser.destroy({ force: true }); // Hard delete
    
    console.log('✅ Soft delete test completed successfully!');
    
    if (allPreferences.length === allPreferencesAfterDelete.length + 1) {
      console.log('✅ Soft delete working correctly - record excluded from normal queries');
    } else {
      console.log('❌ Soft delete may not be working properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSoftDeletes();
