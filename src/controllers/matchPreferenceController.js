const { User, MatchPreference } = require('../models');
const { createError, asyncHandler, ErrorMessages } = require('../utils/errorUtils');

/**
 * Get user's match preference
 */
const getMatchPreference = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const preference = await MatchPreference.findOne({
    where: { userId }
  });

  res.status(200).json({
    success: true,
    data: {
      preference
    }
  });
});

/**
 * Create or update match preference
 */
const setMatchPreference = asyncHandler(async (req, res, next) => {
  const {
    ageMin,
    ageMax,
    gender,
    maritalStatus,
    height,
    complexion,
    bodySize,
    occupation,
    country,
    state,
    lga
  } = req.body;
  const userId = req.user.id;

  // Check if user profile is complete
  if (!req.user.isProfileComplete()) {
    return next(createError(400, 'Please complete your profile before setting match preferences'));
  }

  // Check if user has premium subscription
  if (!req.user.canAccessMatchmaking()) {
    return next(createError(403, 'Upgrade to Premium to Activate Your Matchmaking Preference'));
  }

  // Validate age range
  if (ageMin && ageMax && ageMin > ageMax) {
    return next(createError(400, 'Minimum age cannot be greater than maximum age'));
  }

  // Prepare preference data
  const preferenceData = {
    userId,
    ageMin,
    ageMax,
    gender,
    maritalStatus,
    height,
    complexion,
    bodySize,
    occupation,
    country,
    state,
    lga
  };

  // Check if preference already exists
  const existingPreference = await MatchPreference.findOne({
    where: { userId }
  });

  let preference;
  if (existingPreference) {
    // Update existing preference
    await existingPreference.update(preferenceData);
    preference = existingPreference;
  } else {
    // Create new preference
    preference = await MatchPreference.create(preferenceData);
  }

  res.status(200).json({
    success: true,
    message: 'Match preference saved successfully',
    data: {
      preference
    }
  });
});

/**
 * Delete match preference
 */
const deleteMatchPreference = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const preference = await MatchPreference.findOne({
    where: { userId }
  });

  if (!preference) {
    return next(createError(404, 'Match preference not found'));
  }

  await preference.destroy();

  res.status(200).json({
    success: true,
    message: 'Match preference deleted successfully'
  });
});

/**
 * Find potential matches based on user's preferences
 */
const findMatches = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Check if user has premium subscription
  if (!req.user.canAccessMatchmaking()) {
    return next(createError(403, 'Upgrade to Premium to Activate Your Matchmaking Preference'));
  }

  // Get user's preference
  const preference = await MatchPreference.findOne({
    where: { userId }
  });

  if (!preference) {
    return next(createError(400, 'Please set your match preferences first'));
  }

  // Build match criteria
  const matchCriteria = {
    id: { [require('sequelize').Op.ne]: userId }, // Exclude self
  };

  // Add criteria based on preferences
  if (preference.gender) {
    matchCriteria.gender = preference.gender;
  }
  if (preference.maritalStatus) {
    matchCriteria.maritalStatus = preference.maritalStatus;
  }
  if (preference.complexion) {
    matchCriteria.complexion = preference.complexion;
  }
  if (preference.bodySize) {
    matchCriteria.bodySize = preference.bodySize;
  }
  if (preference.occupation) {
    matchCriteria.occupation = preference.occupation;
  }
  if (preference.country) {
    matchCriteria.country = preference.country;
  }
  if (preference.state) {
    matchCriteria.state = preference.state;
  }
  if (preference.lga) {
    matchCriteria.lga = preference.lga;
  }

  // Find potential matches
  const matches = await User.findAll({
    where: matchCriteria,
    attributes: ['id', 'realName', 'username', 'profilePicture', 'dateOfBirth', 'gender', 'maritalStatus', 'height', 'complexion', 'bodySize', 'occupation', 'country', 'state', 'lga', 'interests', 'hobbies'],
    limit: 20 // Limit results
  });

  // Filter by age if specified
  let filteredMatches = matches;
  if (preference.ageMin || preference.ageMax) {
    filteredMatches = matches.filter(match => {
      if (!match.dateOfBirth) return false;
      
      const age = new Date().getFullYear() - new Date(match.dateOfBirth).getFullYear();
      
      if (preference.ageMin && age < preference.ageMin) return false;
      if (preference.ageMax && age > preference.ageMax) return false;
      
      return true;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      matches: filteredMatches,
      total: filteredMatches.length
    }
  });
});

module.exports = {
  getMatchPreference,
  setMatchPreference,
  deleteMatchPreference,
  findMatches
}; 