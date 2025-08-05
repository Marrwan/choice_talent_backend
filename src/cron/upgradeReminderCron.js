const cron = require('node-cron');
const { sendUpgradeReminders } = require('../services/upgradeReminderService');
require('dotenv').config();

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running daily upgrade reminder job...');
  try {
    const result = await sendUpgradeReminders();
    console.log(`[CRON] Upgrade reminders sent: ${result.count}`);
  } catch (error) {
    console.error('[CRON] Error sending upgrade reminders:', error);
  }
});

// For manual/one-off run
(async () => {
  await sendUpgradeReminders();
  process.exit(0);
})(); 