const { User } = require('../models');
const emailService = require('./emailService');

/**
 * Send upgrade reminders to users who haven't upgraded
 */
const sendUpgradeReminders = async () => {
  try {
    // Find users who:
    // 1. Have free subscription status
    // 2. Have completed their profile
    // 3. Haven't received a reminder in the last 7 days
    // 4. Have received less than 5 reminders total
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersToRemind = await User.findAll({
      where: {
        subscriptionStatus: 'free',
        lastUpgradeReminder: {
          [require('sequelize').Op.or]: [
            { [require('sequelize').Op.lt]: sevenDaysAgo },
            null
          ]
        },
        upgradeReminderCount: {
          [require('sequelize').Op.lt]: 5
        }
      }
    });

    console.log(`Found ${usersToRemind.length} users to send upgrade reminders to`);

    for (const user of usersToRemind) {
      try {
        // Check if profile is complete
        if (user.isProfileComplete()) {
          // Send upgrade reminder email
          await emailService.sendUpgradeReminder(
            user.email, 
            user.name, 
            user.upgradeReminderCount + 1
          );

          // Update reminder count and last reminder date
          await user.incrementUpgradeReminder();

          console.log(`Upgrade reminder sent to ${user.email}`);
        }
      } catch (error) {
        console.error(`Failed to send upgrade reminder to ${user.email}:`, error);
      }
    }

    return {
      success: true,
      message: `Upgrade reminders sent to ${usersToRemind.length} users`,
      count: usersToRemind.length
    };
  } catch (error) {
    console.error('Error sending upgrade reminders:', error);
    throw error;
  }
};

/**
 * Check if a user should receive an upgrade reminder
 */
const shouldSendReminder = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user || user.subscriptionStatus === 'premium') {
      return false;
    }

    // Check if profile is complete
    if (!user.isProfileComplete()) {
      return false;
    }

    // Check if reminder was sent recently (within 7 days)
    if (user.lastUpgradeReminder) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (user.lastUpgradeReminder > sevenDaysAgo) {
        return false;
      }
    }

    // Check if too many reminders have been sent
    if (user.upgradeReminderCount >= 5) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking reminder eligibility:', error);
    return false;
  }
};

/**
 * Send a single upgrade reminder to a specific user
 */
const sendReminderToUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.subscriptionStatus === 'premium') {
      throw new Error('User already has premium subscription');
    }

    if (!user.isProfileComplete()) {
      throw new Error('User profile not complete');
    }

    // Send upgrade reminder email
    await emailService.sendUpgradeReminder(
      user.email, 
      user.name, 
      user.upgradeReminderCount + 1
    );

    // Update reminder count and last reminder date
    await user.incrementUpgradeReminder();

    return {
      success: true,
      message: 'Upgrade reminder sent successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        reminderCount: user.upgradeReminderCount
      }
    };
  } catch (error) {
    console.error('Error sending reminder to user:', error);
    throw error;
  }
};

module.exports = {
  sendUpgradeReminders,
  shouldSendReminder,
  sendReminderToUser
}; 