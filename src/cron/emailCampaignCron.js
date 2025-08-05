const cron = require('node-cron');
const { EmailCampaign, EmailLog } = require('../models');
const emailCampaignService = require('../services/emailCampaignService');
require('dotenv').config();

/**
 * Process active email campaigns
 * Runs every hour to send emails with rate limiting
 */
const processEmailCampaigns = async () => {
  console.log('[EMAIL_CRON] Starting email campaign processing...');
  
  try {
    // Get all active campaigns
    const activeCampaigns = await EmailCampaign.findAll({
      where: {
        status: 'active'
      }
    });

    console.log(`[EMAIL_CRON] Found ${activeCampaigns.length} active campaigns`);

    for (const campaign of activeCampaigns) {
      try {
        console.log(`[EMAIL_CRON] Processing campaign: ${campaign.name} (ID: ${campaign.id})`);
        
        // Check if campaign has pending emails
        const pendingCount = await EmailLog.count({
          where: {
            campaignId: campaign.id,
            status: 'pending'
          }
        });

        if (pendingCount === 0) {
          console.log(`[EMAIL_CRON] No pending emails for campaign ${campaign.name}`);
          
          // Mark campaign as completed
          await campaign.update({
            status: 'completed',
            completedAt: new Date()
          });
          
          console.log(`[EMAIL_CRON] Campaign ${campaign.name} marked as completed`);
          continue;
        }

        // Send emails for this campaign (respecting rate limit)
        const result = await emailCampaignService.sendCampaignEmails(campaign.id);
        
        console.log(`[EMAIL_CRON] Campaign ${campaign.name}: Sent ${result.sentCount}, Failed ${result.failedCount}, Remaining ${result.remainingEmails}`);
        
        if (result.isComplete) {
          console.log(`[EMAIL_CRON] Campaign ${campaign.name} completed`);
        }
        
      } catch (error) {
        console.error(`[EMAIL_CRON] Error processing campaign ${campaign.name}:`, error);
      }
    }

    console.log('[EMAIL_CRON] Email campaign processing completed');
    
  } catch (error) {
    console.error('[EMAIL_CRON] Error in email campaign processing:', error);
  }
};

/**
 * Retry failed emails
 * Runs every 2 hours to retry failed emails
 */
const retryFailedEmails = async () => {
  console.log('[EMAIL_CRON] Starting failed email retry process...');
  
  try {
    // Get failed emails that can be retried (max 3 retries)
    const failedEmails = await EmailLog.findAll({
      where: {
        status: 'failed',
        retryCount: {
          [require('sequelize').Op.lt]: 3
        },
        nextRetryAt: {
          [require('sequelize').Op.lte]: new Date()
        }
      },
      include: [{
        model: EmailCampaign,
        as: 'campaign',
        where: {
          status: 'active'
        }
      }],
      limit: 50 // Process max 50 failed emails at a time
    });

    console.log(`[EMAIL_CRON] Found ${failedEmails.length} failed emails to retry`);

    for (const emailLog of failedEmails) {
      try {
        console.log(`[EMAIL_CRON] Retrying email to ${emailLog.recipientEmail}`);
        
        // Send email based on campaign type
        let result;
        if (emailLog.campaign.name.toLowerCase().includes('career profile') || 
            emailLog.campaign.subject.toLowerCase().includes('career profile')) {
          result = await require('../services/emailService').sendCareerProfileEmail(
            emailLog.recipientEmail,
            emailLog.recipientName
          );
        } else {
          result = await require('../services/emailService').sendCampaignEmail(
            emailLog.recipientEmail,
            emailLog.recipientName,
            emailLog.campaign.subject,
            emailLog.campaign.template
          );
        }

        // Update email log
        await emailLog.update({
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId
        });

        console.log(`[EMAIL_CRON] Successfully retried email to ${emailLog.recipientEmail}`);
        
      } catch (error) {
        console.error(`[EMAIL_CRON] Failed to retry email to ${emailLog.recipientEmail}:`, error);
        
        // Update retry count and set next retry time
        const nextRetryAt = new Date();
        nextRetryAt.setHours(nextRetryAt.getHours() + 2); // Retry in 2 hours
        
        await emailLog.update({
          errorMessage: error.message,
          retryCount: emailLog.retryCount + 1,
          nextRetryAt
        });
      }
    }

    console.log('[EMAIL_CRON] Failed email retry process completed');
    
  } catch (error) {
    console.error('[EMAIL_CRON] Error in failed email retry process:', error);
  }
};

/**
 * Clean up old email logs
 * Runs daily to clean up old email logs
 */
const cleanupOldEmailLogs = async () => {
  console.log('[EMAIL_CRON] Starting email log cleanup...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await EmailLog.destroy({
      where: {
        createdAt: {
          [require('sequelize').Op.lt]: thirtyDaysAgo
        },
        status: {
          [require('sequelize').Op.in]: ['sent', 'failed']
        }
      }
    });

    console.log(`[EMAIL_CRON] Cleaned up ${deletedCount} old email logs`);
    
  } catch (error) {
    console.error('[EMAIL_CRON] Error in email log cleanup:', error);
  }
};

// Schedule cron jobs
const scheduleEmailCampaignJobs = () => {
  // Process email campaigns every hour
  cron.schedule('0 * * * *', processEmailCampaigns, {
    scheduled: true,
    timezone: 'Africa/Lagos'
  });

  // Retry failed emails every 2 hours
  cron.schedule('0 */2 * * *', retryFailedEmails, {
    scheduled: true,
    timezone: 'Africa/Lagos'
  });

  // Clean up old email logs daily at 2 AM
  cron.schedule('0 2 * * *', cleanupOldEmailLogs, {
    scheduled: true,
    timezone: 'Africa/Lagos'
  });

  console.log('[EMAIL_CRON] Email campaign cron jobs scheduled');
};

// Export functions for manual execution
module.exports = {
  processEmailCampaigns,
  retryFailedEmails,
  cleanupOldEmailLogs,
  scheduleEmailCampaignJobs
};

// For manual/one-off execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'process':
      processEmailCampaigns().then(() => process.exit(0));
      break;
    case 'retry':
      retryFailedEmails().then(() => process.exit(0));
      break;
    case 'cleanup':
      cleanupOldEmailLogs().then(() => process.exit(0));
      break;
    default:
      console.log('Usage: node emailCampaignCron.js [process|retry|cleanup]');
      process.exit(1);
  }
} 