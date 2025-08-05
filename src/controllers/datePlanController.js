const { DatePlan } = require('../models');
const { createError, asyncHandler, ErrorMessages } = require('../utils/errorUtils');

/**
 * Get user's date plans
 */
const getDatePlans = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const whereClause = { userId };
  if (status) {
    whereClause.status = status;
  }

  const datePlans = await DatePlan.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: {
      datePlans,
      total: datePlans.length
    }
  });
});

/**
 * Get a specific date plan
 */
const getDatePlan = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const datePlan = await DatePlan.findOne({
    where: {
      id,
      userId
    }
  });

  if (!datePlan) {
    return next(createError(404, 'Date plan not found'));
  }

  res.status(200).json({
    success: true,
    data: {
      datePlan
    }
  });
});

/**
 * Create a new date plan
 */
const createDatePlan = asyncHandler(async (req, res, next) => {
  const { budget, expectations, plannedDate } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!budget || budget.trim() === '') {
    return next(createError(400, 'Budget is required'));
  }

  // Create date plan
  const datePlan = await DatePlan.create({
    userId,
    budget: budget.trim(),
    expectations: expectations ? expectations.trim() : null,
    plannedDate: plannedDate || null,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Date plan created successfully',
    data: {
      datePlan
    }
  });
});

/**
 * Update a date plan
 */
const updateDatePlan = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { budget, expectations, plannedDate, status } = req.body;

  // Find the date plan
  const datePlan = await DatePlan.findOne({
    where: {
      id,
      userId
    }
  });

  if (!datePlan) {
    return next(createError(404, 'Date plan not found'));
  }

  // Prepare update data
  const updateData = {};
  if (budget !== undefined) updateData.budget = budget.trim();
  if (expectations !== undefined) updateData.expectations = expectations ? expectations.trim() : null;
  if (plannedDate !== undefined) updateData.plannedDate = plannedDate;
  if (status !== undefined) updateData.status = status;

  // Update the date plan
  await datePlan.update(updateData);

  res.status(200).json({
    success: true,
    message: 'Date plan updated successfully',
    data: {
      datePlan
    }
  });
});

/**
 * Delete a date plan
 */
const deleteDatePlan = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  const datePlan = await DatePlan.findOne({
    where: {
      id,
      userId
    }
  });

  if (!datePlan) {
    return next(createError(404, 'Date plan not found'));
  }

  await datePlan.destroy();

  res.status(200).json({
    success: true,
    message: 'Date plan deleted successfully'
  });
});

/**
 * Get date planning statistics
 */
const getDatePlanStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await DatePlan.findAll({
    where: { userId },
    attributes: [
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
    ],
    group: ['status'],
    raw: true,
    paranoid: false // Explicitly disable soft deletes
  });

  // Format stats
  const formattedStats = {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  };

  stats.forEach(stat => {
    formattedStats[stat.status] = parseInt(stat.count);
    formattedStats.total += parseInt(stat.count);
  });

  res.status(200).json({
    success: true,
    data: {
      stats: formattedStats
    }
  });
});

/**
 * Submit date plan request (alias for create)
 */
const submitDatePlanRequest = createDatePlan;

module.exports = {
  getDatePlans,
  getDatePlan,
  createDatePlan,
  updateDatePlan,
  deleteDatePlan,
  getDatePlanStats,
  submitDatePlanRequest
}; 