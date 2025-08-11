const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken, generatePasswordResetToken, verifyPasswordResetToken } = require('../utils/jwtUtils');
const { createError } = require('../utils/errorUtils');
const emailService = require('../services/emailService');
const crypto = require('crypto');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw createError(400, 'Email already registered');
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(64).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user - password will be hashed by the model hook
    const user = await User.create({
      email,
      passwordHash: password,
      name,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false
    });

    // Send activation email
    try {
      await emailService.sendActivationEmail(user.email, user.name, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to activate your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user account
 */
const activateAccount = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with valid activation token
    const user = await User.scope('withPassword').findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [require('sequelize').Op.gt]: new Date()
        },
        isEmailVerified: false
      }
    });

    if (!user) {
      throw createError(400, 'Invalid or expired activation token');
    }

    // Activate the account
    await user.update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    res.json({
      success: true,
      message: 'Account activated successfully! You can now login.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.scope('withPassword').findOne({
      where: { email }
    });
    if(!user){
      throw createError(400, 'User not found');
    }
    if (!user || !(await user.validatePassword(password))) {
      // throw createError(401, 'Invalid email or password');
    }

    // Check if account is activated
    if (!user.isEmailVerified) {
      throw createError(401, 'Please activate your account by clicking the link sent to your email');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          careerProfilePicture: user.careerProfilePicture,
          isEmailVerified: user.isEmailVerified,
          subscriptionStatus: user.subscriptionStatus,
          isPremium: user.isPremium(),
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can still return a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          realName: user.realName,
          username: user.username,
          profilePicture: user.profilePicture,
          careerProfilePicture: user.careerProfilePicture,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          occupation: user.occupation,
          country: user.country,
          state: user.state,
          lga: user.lga,
          contactNumber: user.contactNumber,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          subscriptionStatus: user.subscriptionStatus,
          isPremium: user.isPremium(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });
    
    if (user) {
      // Generate reset token
      const resetToken = generatePasswordResetToken(user);
      const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires
      });

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Always return the same message for security
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.scope('withPassword').findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400);
    }

    // Verify the token
    try {
      verifyPasswordResetToken(token, user);
    } catch (tokenError) {
      throw createError('Invalid reset token', 400);
    }

    // Update password and clear reset token
    await user.update({
      passwordHash: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    // Send notification email
    try {
      await emailService.sendPasswordChangeNotification(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send password change notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (authenticated user)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.scope('withPassword').findByPk(req.user.userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    if (!(await user.validatePassword(currentPassword))) {
      throw createError('Current password is incorrect', 400);
    }

    // Update password
    await user.update({
      passwordHash: newPassword
    });

    // Send notification email
    try {
      await emailService.sendPasswordChangeNotification(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send password change notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend activation email
 */
const resendActivation = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ 
      where: { 
        email,
        isEmailVerified: false 
      } 
    });

    if (user) {
      // Generate new activation token
      const emailVerificationToken = crypto.randomBytes(64).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await user.update({
        emailVerificationToken,
        emailVerificationExpires
      });

      // Send activation email
      try {
        await emailService.sendActivationEmail(user.email, user.name, emailVerificationToken);
      } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'If an unverified account with that email exists, an activation link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  activateAccount,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  resendActivation
}; 