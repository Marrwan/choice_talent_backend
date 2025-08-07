const { User } = require('../models');
const { createError, asyncHandler, ErrorMessages } = require('../utils/errorUtils');

/**
 * Get user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const {
    name,
    realName,
    username,
    interests,
    hobbies,
    loveLanguage,
    profilePicture,
    dateOfBirth,
    gender,
    maritalStatus,
    height,
    complexion,
    bodySize,
    occupation,
    country,
    state,
    lga,
    contactNumber,
    email
  } = req.body;
  const userId = req.user.id;

  // Check if email is being changed and if it's already taken
  if (email && email.toLowerCase() !== req.user.email) {
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
        id: { [require('sequelize').Op.ne]: userId }
      }
    });
    if (existingUser) {
      return next(createError(400, ErrorMessages.EMAIL_ALREADY_EXISTS));
    }
  }
  // Check if username is being changed and if it's already taken
  if (username && username !== req.user.username) {
    const existingUsername = await User.findOne({
      where: {
        username: username,
        id: { [require('sequelize').Op.ne]: userId }
      }
    });
    if (existingUsername) {
      return next(createError(400, 'Username already exists'));
    }
  }

  // Prepare update data
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (realName !== undefined) updateData.realName = realName;
  if (username !== undefined) updateData.username = username;
  if (interests !== undefined) updateData.interests = interests;
  if (hobbies !== undefined) updateData.hobbies = hobbies;
  if (loveLanguage !== undefined) updateData.loveLanguage = loveLanguage;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (gender !== undefined) updateData.gender = gender;
  if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
  if (height !== undefined) updateData.height = height;
  if (complexion !== undefined) updateData.complexion = complexion;
  if (bodySize !== undefined) updateData.bodySize = bodySize;
  if (occupation !== undefined) updateData.occupation = occupation;
  if (country !== undefined) updateData.country = country;
  if (state !== undefined) updateData.state = state;
  if (lga !== undefined) updateData.lga = lga;
  if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
  if (email !== undefined) updateData.email = email.toLowerCase();

  // Update user
  await req.user.update(updateData);

  // Fetch updated user
  const updatedUser = await User.findByPk(userId);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Change user password
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  // Verify old password
  const isOldPasswordValid = await req.user.validatePassword(oldPassword);
  if (!isOldPasswordValid) {
    return next(createError(400, 'Current password is incorrect'));
  }

  // Check if new password is different from old password
  const isSamePassword = await req.user.validatePassword(newPassword);
  if (isSamePassword) {
    return next(createError(400, 'New password must be different from current password'));
  }

  // Update password
  await req.user.update({
    passwordHash: newPassword // Will be hashed by the model hook
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Delete user account (soft delete)
 */
const deleteAccount = asyncHandler(async (req, res) => {
  await req.user.destroy(); // Soft delete due to paranoid: true

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

/**
 * Get user dashboard data
 */
const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;

  // You can add more dashboard-specific data here
  const dashboardData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    },
    stats: {
      memberSince: user.createdAt,
      lastLogin: user.lastLoginAt
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

/**
 * Get list of users for chat
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ['id', 'name', 'username', 'email', 'profilePicture', 'is_online'],
    where: {
      id: { [require('sequelize').Op.ne]: req.user.id } // Exclude current user
    },
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    data: users
  });
});

// Search users
const searchUsers = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const users = await User.findAll({
    attributes: ['id', 'name', 'username', 'email', 'profilePicture', 'is_online'],
    where: {
      id: { [require('sequelize').Op.ne]: req.user.id }, // Exclude current user
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { username: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${q}%` } }
      ]
    },
    order: [['name', 'ASC']],
    limit: 50
  });

  res.status(200).json({
    success: true,
    data: users
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getDashboard,
  getUsers,
  searchUsers
}; 