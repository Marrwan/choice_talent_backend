const express = require('express');
const router = express.Router();
const { authenticateToken: protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Get all subscription plans
router.get('/plans', protect, paymentController.getPlans);

// Initialize a payment
router.post('/initialize', protect, paymentController.initializePayment);

// Verify a payment
router.get('/verify/:reference', protect, paymentController.verifyPayment);

// Get user's current subscription
router.get('/subscription', protect, paymentController.getCurrentSubscription);

// Cancel subscription
router.post('/subscription/cancel', protect, paymentController.cancelSubscription);

module.exports = router; 