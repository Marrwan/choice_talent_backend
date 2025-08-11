const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Create email transporter
 */
const createTransporter = () => {
  // If explicitly set to gmail, use Gmail service
  if (config.email.service && config.email.service.toLowerCase() === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  // Generic SMTP (e.g., WhoGoHost go54)
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure, // true for 465, false for 587
    auth: {
      user: config.email.user,
      pass: config.email.password
    },
    tls: {
      // Allow self-signed or older TLS if provider requires
      rejectUnauthorized: false
    }
  });
};

/**
 * Send activation email to new user
 */
const sendActivationEmail = async (email, name, activationToken) => {
  try {
    const transporter = createTransporter();
    
    const activationUrl = `${config.app.frontendUrl}/activate-account?token=${activationToken}`;
    
    const mailOptions = {
      from: `"MyJobHunting Support" <${config.email.from}>`,
      to: email,
      subject: 'Activate Your MyJobHunting Account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name || 'there'},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your registration, follow this link to activate your account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Activate Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Regards,<br>Support Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Activation email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send activation email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"MyJobHunting Support" <${config.email.from}>`,
      to: email,
      subject: 'Reset Your Password - MyJobHunting',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">Hello ${name || 'there'},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Regards,<br>Support Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send password change notification
 */
const sendPasswordChangeNotification = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${config.app.frontendUrl}/forgot-password`;
    
    const mailOptions = {
      from: `"MyJobHunting Support" <${config.email.from}>`,
      to: email,
      subject: 'Password Changed - MyJobHunting',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Password Changed Successfully</h2>
            <p style="color: #666; line-height: 1.6;">Hello ${name || 'there'},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You or someone has just reset your password. If this activity was not initiated by you, click the link below 
              to retrieve back your password and account, else kindly ignore.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Secure My Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you changed your password yourself, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Regards,<br>Support Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password change notification sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send password change notification:', error);
    throw error;
  }
};

/**
 * Send welcome email to new user (after activation)
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const dashboardUrl = `${config.app.frontendUrl}/dashboard`;
    
    const mailOptions = {
      from: `"MyJobHunting Team" <${config.email.from}>`,
      to: email,
      subject: 'Welcome to MyJobHunting!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to MyJobHunting!</h2>
            <p style="color: #666; line-height: 1.6;">Hello ${name || 'there'},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
               Your account has been successfully activated! We're excited to have you join the MyJobHunting community.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Start exploring our features and discover top talent for your organization.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
             <p>Best regards,<br>The MyJobHunting Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

/**
 * Send upgrade reminder email
 */
const sendUpgradeReminder = async (email, name, reminderCount = 1) => {
  try {
    const transporter = createTransporter();
    
    const upgradeUrl = `${config.app.frontendUrl}/dashboard/subscription`;
    
    const mailOptions = {
      from: `"MyJobHunting Team" <${config.email.from}>`,
      to: email,
      subject: 'Upgrade to Premium - Unlock Your Full Potential!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Ready to Find Your Perfect Match?</h2>
            <p style="color: #666; line-height: 1.6;">Hello ${name || 'there'},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You're missing out on the best features! Upgrade to Premium and unlock:
            </p>
            
            <ul style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>✨ Full access to our matchmaking system</li>
              <li>💬 Initiate chats and calls with potential matches</li>
              <li>🎯 Set detailed match preferences</li>
              <li>💝 Send interest messages and build relationships</li>
              <li>📱 Priority support and enhanced features</li>
            </ul>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-weight: bold;">
                💎 Premium Plan: ₦10,000/month
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${upgradeUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Upgrade to Premium Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Don't miss out on finding your perfect match. Upgrade today and start your journey to meaningful relationships!
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
             <p>Best regards,<br>The MyJobHunting Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Upgrade reminder email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send upgrade reminder email:', error);
    throw error;
  }
};

/**
 * Send subscription activation email
 */
const sendSubscriptionActivation = async (email, name, planName, expiresAt) => {
  try {
    const transporter = createTransporter();
    
    const dashboardUrl = `${config.app.frontendUrl}/dashboard`;
    
    const mailOptions = {
      from: `"MyJobHunting Team" <${config.email.from}>`,
      to: email,
      subject: 'Premium Subscription Activated - Welcome to Premium!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">MyJobHunting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">🎉 Welcome to Premium!</h2>
            <p style="color: #666; line-height: 1.6;">Hello ${name || 'there'},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Congratulations! Your ${planName} subscription has been successfully activated.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #155724; margin: 0; font-weight: bold;">
                ✅ Subscription Details:
              </p>
              <p style="color: #155724; margin: 5px 0 0 0;">
                Plan: ${planName}<br>
                Expires: ${new Date(expiresAt).toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You now have access to all premium features including:
            </p>
            
            <ul style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>✨ Full matchmaking system access</li>
              <li>💬 Initiate chats and calls</li>
              <li>🎯 Set detailed preferences</li>
              <li>💝 Send interest messages</li>
              <li>📱 Priority support</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Start Finding Matches
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Best regards,<br>The MyJobHunting Team</p>
            <p>&copy; ${new Date().getFullYear()} MyJobHunting. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Subscription activation email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send subscription activation email:', error);
    throw error;
  }
};

/**
 * Send career profile completion email
 */
const sendCareerProfileEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const loginUrl = 'https://jobprofile.com.ng/login';
    
    const mailOptions = {
      from: `"Career Profile Online" <noreply@choicetalents.com.ng>`,
      to: email,
      subject: 'Complete Your Career Profile',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0044CC; margin: 0;">Career Profile Online</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Profile Update</h2>
            <p style="color: #666; line-height: 1.6;">Hi ${email},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hiring managers and employers can't see the important details they are looking for on your career profile, 
              and as such they are unable to make hiring decisions.
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              To improve your chances for juicy employment offers, ensure to update your profile from time to time.
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thousands of people keep getting new offers monthly, you should too.
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Proceed to update your professional career profile ASAP, using the details below.
            </p>
            
            <div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1565c0; margin: 0; font-weight: bold;">Login Details:</p>
              <p style="color: #1565c0; margin: 5px 0 0 0;">
                Website: <a href="${loginUrl}" style="color: #1565c0;">${loginUrl}</a><br>
                Your login email: ${email}<br>
                Password: If you can't remember your password, click on Forgot Password to get support.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Complete Your Profile
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Cheers!!!<br>Support Team.</p>
            <p>&copy; ${new Date().getFullYear()} Career Profile Online. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Career profile email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send career profile email:', error);
    throw error;
  }
};

/**
 * Send custom campaign email
 */
const sendCampaignEmail = async (email, name, subject, template) => {
  try {
    const transporter = createTransporter();
    
    // Replace template variables
    let processedTemplate = template;
    processedTemplate = processedTemplate.replace(/\{\{email\}\}/g, email);
    processedTemplate = processedTemplate.replace(/\{\{name\}\}/g, name || email);
    
    const mailOptions = {
      from: `"Career Profile Online" <noreply@choicetalents.com.ng>`,
      to: email,
      subject: subject,
      html: processedTemplate
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Campaign email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send campaign email:', error);
    throw error;
  }
};

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeNotification,
  sendWelcomeEmail,
  sendUpgradeReminder,
  sendSubscriptionActivation,
  sendCareerProfileEmail,
  sendCampaignEmail
}; 