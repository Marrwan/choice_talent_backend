const asyncHandler = require('express-async-handler');
const createError = require('http-errors');
const { JobHuntingSettings } = require('../models');

// Get job hunting settings for the authenticated user
const getJobHuntingSettings = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const settings = await JobHuntingSettings.findOne({
    where: { userId },
    paranoid: false // Explicitly disable soft deletes
  });

  if (!settings) {
    return res.status(200).json({
      success: true,
      data: { settings: null },
      message: 'No job hunting settings found'
    });
  }

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

// Create or update job hunting settings
const createOrUpdateJobHuntingSettings = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  try {
    console.log('Job settings request body:', req.body);
    const {
      jobTypes,
      careerCategory,
      categoryOfPositions,
      totalYearsOfWorkExperience,
      preferredLocations,
      minimumSalaryExpectation,
      workWithProposedPay,
      salaryExpectationNegotiable
    } = req.body;

    console.log('Parsed fields:', {
      jobTypes,
      careerCategory,
      categoryOfPositions,
      totalYearsOfWorkExperience,
      preferredLocations,
      minimumSalaryExpectation,
      workWithProposedPay,
      salaryExpectationNegotiable
    });

    // Parse array fields if they come as JSON strings
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        return typeof field === 'string' ? [field] : [];
      }
    };

    // Parse boolean
    const parseBoolean = (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') return val === 'true' || val === '1';
      return false;
    };

    const parsedJobTypes = parseArrayField(jobTypes);
    const parsedCategoryOfPositions = parseArrayField(categoryOfPositions);
    const parsedPreferredLocations = parseArrayField(preferredLocations);
    const parsedWorkWithProposedPay = parseBoolean(workWithProposedPay);

    console.log('Parsed data:', {
      parsedJobTypes,
      careerCategory,
      parsedCategoryOfPositions,
      totalYearsOfWorkExperience,
      parsedPreferredLocations,
      minimumSalaryExpectation,
      parsedWorkWithProposedPay,
      salaryExpectationNegotiable
    });

    // Validate required fields
    if (!careerCategory) {
      return next(createError(400, 'Career category is required'));
    }
    if (!totalYearsOfWorkExperience) {
      return next(createError(400, 'Total years of work experience is required'));
    }

    // Validate salary expectation if provided
    if (minimumSalaryExpectation && minimumSalaryExpectation.trim() === '') {
      return next(createError(400, 'Minimum salary expectation cannot be empty if provided'));
    }

    // Find existing settings or create new ones
    let settings = await JobHuntingSettings.findOne({ 
      where: { userId },
      paranoid: false // Explicitly disable soft deletes
    });
    
    const settingsData = {
      jobTypes: parsedJobTypes,
      careerCategory,
      categoryOfPositions: parsedCategoryOfPositions,
      totalYearsOfWorkExperience,
      preferredLocations: parsedPreferredLocations,
      minimumSalaryExpectation: minimumSalaryExpectation || null,
      workWithProposedPay: parsedWorkWithProposedPay,
      salaryExpectationNegotiable
    };

    console.log('Settings data to save:', settingsData);
    
    if (settings) {
      // Update existing settings
      await settings.update(settingsData);
    } else {
      // Create new settings
      settings = await JobHuntingSettings.create({
        userId,
        ...settingsData
      });
    }

    res.status(200).json({
      success: true,
      data: { settings },
      message: settings ? 'Job hunting settings updated successfully' : 'Job hunting settings created successfully'
    });
  } catch (error) {
    console.error('Error saving job hunting settings:', error);
    
    // Return the specific validation error message
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return next(createError(400, `Validation error: ${validationErrors}`));
    }
    
    return next(createError(500, 'Failed to save job hunting settings'));
  }
});

// Delete job hunting settings
const deleteJobHuntingSettings = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const settings = await JobHuntingSettings.findOne({
    where: { userId },
    paranoid: false // Explicitly disable soft deletes
  });

  if (!settings) {
    return next(createError(404, 'Job hunting settings not found'));
  }

  await settings.destroy({ force: true }); // Force delete since paranoid is false

  res.status(200).json({
    success: true,
    message: 'Job hunting settings deleted successfully'
  });
});

module.exports = {
  getJobHuntingSettings,
  createOrUpdateJobHuntingSettings,
  deleteJobHuntingSettings
}; 