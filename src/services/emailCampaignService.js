const { EmailCampaign, EmailLog, User, ProfessionalCareerProfile } = require('../models');
const emailService = require('./emailService');
const { Op } = require('sequelize');

/**
 * Create a new email campaign
 */
const createCampaign = async (campaignData) => {
  try {
    const campaign = await EmailCampaign.create(campaignData);
    
    // Calculate total emails based on target audience
    const totalEmails = await calculateTotalEmails(campaign.targetAudience, campaign.customEmailList);
    
    // Update campaign with total emails
    await campaign.update({ totalEmails });
    
    return {
      success: true,
      campaign,
      totalEmails
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

/**
 * Calculate total emails for a campaign
 */
const calculateTotalEmails = async (targetAudience, customEmailList = []) => {
  try {
    switch (targetAudience) {
      case 'incomplete_profiles':
        // Find users without complete professional career profiles
        const incompleteUsers = await User.findAll({
          include: [{
            model: ProfessionalCareerProfile,
            as: 'professionalCareerProfile',
            required: false
          }],
          where: {
            [Op.or]: [
              { '$professionalCareerProfile.id$': null },
              { '$professionalCareerProfile.full_name$': null }
            ]
          }
        });
        return incompleteUsers.length;
        
      case 'all_users':
        const allUsers = await User.count();
        return allUsers;
        
      case 'custom_list':
        return customEmailList.length;
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating total emails:', error);
    return 0;
  }
};

/**
 * Get recipients for a campaign
 */
const getCampaignRecipients = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    let recipients = [];

    switch (campaign.targetAudience) {
      case 'incomplete_profiles':
        // Get users without complete professional career profiles
        const incompleteUsers = await User.findAll({
          include: [{
            model: ProfessionalCareerProfile,
            as: 'professionalCareerProfile',
            required: false
          }],
          where: {
            [Op.or]: [
              { '$professionalCareerProfile.id$': null },
              { '$professionalCareerProfile.full_name$': null }
            ]
          },
          attributes: ['id', 'email', 'name', 'realName']
        });
        
        recipients = incompleteUsers.map(user => ({
          email: user.email,
          name: user.realName || user.name || user.email
        }));
        break;
        
      case 'all_users':
        const allUsers = await User.findAll({
          attributes: ['id', 'email', 'name', 'realName']
        });
        
        recipients = allUsers.map(user => ({
          email: user.email,
          name: user.realName || user.name || user.email
        }));
        break;
        
      case 'custom_list':
        recipients = campaign.customEmailList.map(email => ({
          email,
          name: email.split('@')[0] // Use part before @ as name
        }));
        break;
    }

    return recipients;
  } catch (error) {
    console.error('Error getting campaign recipients:', error);
    throw error;
  }
};

/**
 * Initialize campaign by creating email logs
 */
const initializeCampaign = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get recipients
    const recipients = await getCampaignRecipients(campaignId);
    
    // Create email logs for all recipients
    const emailLogs = recipients.map(recipient => ({
      campaignId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      status: 'pending'
    }));

    await EmailLog.bulkCreate(emailLogs);
    
    console.log(`Created ${emailLogs.length} email logs for campaign ${campaignId}`);
    
    return {
      success: true,
      totalRecipients: emailLogs.length
    };
  } catch (error) {
    console.error('Error initializing campaign:', error);
    throw error;
  }
};

/**
 * Send emails for a campaign (with rate limiting)
 */
const sendCampaignEmails = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Campaign is not active');
    }

    // Get pending emails for this campaign
    const pendingEmails = await EmailLog.findAll({
      where: {
        campaignId,
        status: 'pending'
      },
      limit: campaign.emailsPerHour // Rate limit: 45 emails per hour
    });

    console.log(`Sending ${pendingEmails.length} emails for campaign ${campaignId}`);

    let sentCount = 0;
    let failedCount = 0;

    for (const emailLog of pendingEmails) {
      try {
        // Send email based on campaign type
        let result;
        if (campaign.name.toLowerCase().includes('career profile') || 
            campaign.subject.toLowerCase().includes('career profile')) {
          result = await emailService.sendCareerProfileEmail(
            emailLog.recipientEmail,
            emailLog.recipientName
          );
        } else {
          result = await emailService.sendCampaignEmail(
            emailLog.recipientEmail,
            emailLog.recipientName,
            campaign.subject,
            campaign.template
          );
        }

        // Update email log
        await emailLog.update({
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId
        });

        sentCount++;
        
        // Add delay to respect rate limits (if needed)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to send email to ${emailLog.recipientEmail}:`, error);
        
        // Update email log with error
        await emailLog.update({
          status: 'failed',
          errorMessage: error.message,
          retryCount: emailLog.retryCount + 1
        });

        failedCount++;
      }
    }

    // Update campaign statistics
    await campaign.update({
      sentEmails: campaign.sentEmails + sentCount,
      failedEmails: campaign.failedEmails + failedCount
    });

    // Check if campaign is complete
    const remainingEmails = await EmailLog.count({
      where: {
        campaignId,
        status: 'pending'
      }
    });

    if (remainingEmails === 0) {
      await campaign.update({
        status: 'completed',
        completedAt: new Date()
      });
    }

    return {
      success: true,
      sentCount,
      failedCount,
      remainingEmails,
      isComplete: remainingEmails === 0
    };
  } catch (error) {
    console.error('Error sending campaign emails:', error);
    throw error;
  }
};

/**
 * Start a campaign
 */
const startCampaign = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new Error('Campaign can only be started from draft status');
    }

    // Initialize campaign
    await initializeCampaign(campaignId);
    
    // Update campaign status
    await campaign.update({
      status: 'active',
      startedAt: new Date()
    });

    // Send first batch of emails
    const result = await sendCampaignEmails(campaignId);

    return {
      success: true,
      campaign,
      ...result
    };
  } catch (error) {
    console.error('Error starting campaign:', error);
    throw error;
  }
};

/**
 * Pause a campaign
 */
const pauseCampaign = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Campaign is not active');
    }

    await campaign.update({ status: 'paused' });

    return {
      success: true,
      campaign
    };
  } catch (error) {
    console.error('Error pausing campaign:', error);
    throw error;
  }
};

/**
 * Resume a campaign
 */
const resumeCampaign = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'paused') {
      throw new Error('Campaign is not paused');
    }

    await campaign.update({ status: 'active' });

    // Send next batch of emails
    const result = await sendCampaignEmails(campaignId);

    return {
      success: true,
      campaign,
      ...result
    };
  } catch (error) {
    console.error('Error resuming campaign:', error);
    throw error;
  }
};

/**
 * Get campaign statistics
 */
const getCampaignStats = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const emailLogs = await EmailLog.findAll({
      where: { campaignId },
      attributes: ['status']
    });

    const stats = {
      total: emailLogs.length,
      sent: emailLogs.filter(log => log.status === 'sent').length,
      failed: emailLogs.filter(log => log.status === 'failed').length,
      pending: emailLogs.filter(log => log.status === 'pending').length,
      bounced: emailLogs.filter(log => log.status === 'bounced').length
    };

    return {
      success: true,
      campaign,
      stats
    };
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    throw error;
  }
};

/**
 * Get all campaigns
 */
const getAllCampaigns = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const campaigns = await EmailCampaign.findAndCountAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      success: true,
      campaigns: campaigns.rows,
      total: campaigns.count,
      page,
      totalPages: Math.ceil(campaigns.count / limit)
    };
  } catch (error) {
    console.error('Error getting campaigns:', error);
    throw error;
  }
};

module.exports = {
  createCampaign,
  calculateTotalEmails,
  getCampaignRecipients,
  initializeCampaign,
  sendCampaignEmails,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignStats,
  getAllCampaigns
}; 