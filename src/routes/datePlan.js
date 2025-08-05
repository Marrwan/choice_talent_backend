const express = require('express');
const router = express.Router();

const datePlanController = require('../controllers/datePlanController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/date-plan
 * @desc    Get user's date plans
 * @access  Private
 */
router.get('/',
  authenticateToken,
  datePlanController.getDatePlans
);

/**
 * @route   GET /api/date-plan/stats
 * @desc    Get date plan statistics
 * @access  Private
 */
router.get('/stats',
  authenticateToken,
  datePlanController.getDatePlanStats
);

/**
 * @route   GET /api/date-plan/:id
 * @desc    Get a specific date plan
 * @access  Private
 */
router.get('/:id',
  authenticateToken,
  datePlanController.getDatePlan
);

/**
 * @route   POST /api/date-plan
 * @desc    Create a new date plan
 * @access  Private
 */
router.post('/',
  authenticateToken,
  datePlanController.createDatePlan
);

/**
 * @route   POST /api/date-plan/submit
 * @desc    Submit date plan request
 * @access  Private
 */
router.post('/submit',
  authenticateToken,
  datePlanController.submitDatePlanRequest
);

/**
 * @route   PUT /api/date-plan/:id
 * @desc    Update a date plan
 * @access  Private
 */
router.put('/:id',
  authenticateToken,
  datePlanController.updateDatePlan
);

/**
 * @route   DELETE /api/date-plan/:id
 * @desc    Delete a date plan
 * @access  Private
 */
router.delete('/:id',
  authenticateToken,
  datePlanController.deleteDatePlan
);

module.exports = router; 