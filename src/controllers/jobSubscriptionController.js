const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { 
  JobSubscription, 
  JobPayment, 
  JobActivityLog, 
  ProfessionalCareerProfile, 
  JobHuntingSettings,
  User 
} = require('../models');
const { createError } = require('../utils/errorUtils');
const { v4: uuidv4 } = require('uuid');
const fileUploadService = require('../services/fileUploadService');

// Check if user is eligible for job subscription
const checkEligibility = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Check if user has completed career profile
  const careerProfile = await ProfessionalCareerProfile.findOne({
    where: { userId }
  });

  if (!careerProfile) {
    return res.status(403).json({
      success: false,
      message: 'You must complete your career profile before accessing job subscription features'
    });
  }

  // Check if user has set job hunting preferences
  const jobHuntingSettings = await JobHuntingSettings.findOne({
    where: { userId }
  });

  if (!jobHuntingSettings) {
    return res.status(403).json({
      success: false,
      message: 'You must set your job hunting preferences before accessing job subscription features'
    });
  }

  // Check if user already has an active subscription
  const activeSubscription = await JobSubscription.findOne({
    where: { 
      userId,
      status: 'active'
    }
  });

  res.status(200).json({
    success: true,
    data: {
      isEligible: true,
      hasActiveSubscription: !!activeSubscription,
      activeSubscription: activeSubscription ? {
        id: activeSubscription.id,
        subscriptionType: activeSubscription.subscriptionType,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        status: activeSubscription.status
      } : null
    }
  });
});

// Get subscription packages
const getSubscriptionPackages = asyncHandler(async (req, res, next) => {
  // Get packages from database
  const { Plan } = require('../models');
  
  const plans = await Plan.findAll({
    where: {
      name: {
        [Op.in]: ['0-2_years', '3-5_years', '6-7_years', '10_plus_years']
      }
    },
    order: [['price', 'ASC']]
  });

  // Transform plans to match frontend expectations
  const packages = plans.map(plan => ({
    id: plan.name,
    name: getPackageDisplayName(plan.name),
    price: plan.price, // Already in kobo
    duration: plan.duration, // Already in days
    description: getPackageDescription(plan.name),
    features: plan.features || []
  }));

  res.status(200).json({
    success: true,
    data: { packages }
  });
});

// Helper function to get package descriptions
const getPackageDescription = (packageName) => {
  const descriptions = {
    '0-2_years': 'Perfect for entry-level professionals',
    '3-5_years': 'Ideal for mid-level professionals', 
    '6-7_years': 'Designed for senior professionals',
    '10_plus_years': 'Premium package for experienced professionals'
  };
  return descriptions[packageName] || 'Professional career support package';
};

// Helper function to get package display names
const getPackageDisplayName = (packageName) => {
  const displayNames = {
    '0-2_years': '0 – 2 years of Work Experience',
    '3-5_years': '3 – 5 years of Work Experience',
    '6-7_years': '6 – 7 years of Work Experience',
    '10_plus_years': '10+ years of Work Experience'
  };
  return displayNames[packageName] || packageName.replace('_', ' ').replace('-', ' ');
};

// Create subscription
const createSubscription = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { subscriptionType } = req.body;

  // Validate subscription type
  const validTypes = ['0-2_years', '3-5_years', '6-7_years', '10_plus_years'];
  if (!validTypes.includes(subscriptionType)) {
    return next(createError(400, 'Invalid subscription type'));
  }

  // Check eligibility
  const careerProfile = await ProfessionalCareerProfile.findOne({
    where: { userId }
  });

  if (!careerProfile) {
    return next(createError(403, 'You must complete your career profile first'));
  }

  const jobHuntingSettings = await JobHuntingSettings.findOne({
    where: { userId }
  });

  if (!jobHuntingSettings) {
    return next(createError(403, 'You must set your job hunting preferences first'));
  }

  // Check for existing active subscription
  const existingSubscription = await JobSubscription.findOne({
    where: { 
      userId,
      status: 'active'
    }
  });

  if (existingSubscription) {
    return next(createError(400, 'You already have an active subscription'));
  }

  // Get package details from database
  const { Plan } = require('../models');
  const plan = await Plan.findOne({
    where: { name: subscriptionType }
  });

  if (!plan) {
    return next(createError(400, 'Invalid subscription type'));
  }

  const packageInfo = {
    price: plan.price / 100, // Convert kobo to Naira for storage
    duration: Math.floor(plan.duration / 30) // Convert days to months for storage
  };

  // Create subscription
  const subscription = await JobSubscription.create({
    userId,
    subscriptionType,
    price: packageInfo.price,
    duration: packageInfo.duration,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscription: {
        id: subscription.id,
        subscriptionType: subscription.subscriptionType,
        price: subscription.price,
        duration: subscription.duration,
        status: subscription.status
      }
    }
  });
});

// Get user's subscriptions
const getUserSubscriptions = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const subscriptions = await JobSubscription.findAll({
    where: { userId },
    include: [
      {
        model: JobPayment,
        as: 'payments',
        attributes: ['id', 'paymentId', 'amount', 'paymentMethod', 'status', 'paymentDate']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: { subscriptions }
  });
});

// Create payment
const createPayment = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { subscriptionId, paymentMethod } = req.body;

  // Validate payment method
  const validMethods = ['bank_transfer', 'flutterwave', 'paystack'];
  if (!validMethods.includes(paymentMethod)) {
    return next(createError(400, 'Invalid payment method'));
  }

  // Get subscription
  const subscription = await JobSubscription.findOne({
    where: { 
      id: subscriptionId,
      userId 
    }
  });

  if (!subscription) {
    return next(createError(404, 'Subscription not found'));
  }

  if (subscription.status !== 'pending') {
    return next(createError(400, 'Subscription is not in pending status'));
  }

  // Generate unique payment ID
  const paymentId = uuidv4();

  // Create payment
  const payment = await JobPayment.create({
    subscriptionId,
    paymentId,
    amount: subscription.price,
    paymentMethod,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Payment created successfully',
    data: {
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status
      }
    }
  });
});

// Upload proof of payment
const uploadProofOfPayment = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { paymentId } = req.params;

  if (!req.file) {
    return next(createError(400, 'Proof of payment file is required'));
  }

  // Get payment
  const payment = await JobPayment.findOne({
    where: { paymentId },
    include: [
      {
        model: JobSubscription,
        as: 'subscription',
        where: { userId }
      }
    ]
  });

  if (!payment) {
    return next(createError(404, 'Payment not found'));
  }

  if (payment.status !== 'pending') {
    return next(createError(400, 'Payment is not in pending status'));
  }

  // Upload file
  const uploadResult = await fileUploadService.uploadFile(req.file, 'payment-proofs');
  
  // Update payment
  await payment.update({
    proofOfPayment: uploadResult.url,
    status: 'pending' // Keep as pending until admin verifies
  });

  res.status(200).json({
    success: true,
    message: 'Proof of payment uploaded successfully',
    data: {
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        proofOfPayment: payment.proofOfPayment,
        status: payment.status
      }
    }
  });
});

// Get activity logs
const getActivityLogs = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const activityLogs = await JobActivityLog.findAll({
    where: { userId },
    include: [
      {
        model: JobSubscription,
        as: 'subscription',
        attributes: ['id', 'subscriptionType', 'status']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: { activityLogs }
  });
});

// Admin: Verify payment and activate subscription
const verifyPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { status, transactionReference } = req.body;

  // Get payment
  const payment = await JobPayment.findOne({
    where: { paymentId },
    include: [
      {
        model: JobSubscription,
        as: 'subscription'
      }
    ]
  });

  if (!payment) {
    return next(createError(404, 'Payment not found'));
  }

  // Update payment
  await payment.update({
    status,
    transactionReference,
    paymentDate: status === 'completed' ? new Date() : null
  });

  // If payment is completed, activate subscription
  if (status === 'completed') {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + payment.subscription.duration);

    await payment.subscription.update({
      status: 'active',
      startDate,
      endDate
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        status: payment.status,
        transactionReference: payment.transactionReference
      }
    }
  });
});

// Admin: Create activity log
const createActivityLog = asyncHandler(async (req, res, next) => {
  const { userId, subscriptionId, activityType, companyName, companyLocation, position, description } = req.body;

  const activityLog = await JobActivityLog.create({
    userId,
    subscriptionId,
    activityType,
    companyName,
    companyLocation,
    position,
    description,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Activity log created successfully',
    data: { activityLog }
  });
});

module.exports = {
  checkEligibility,
  getSubscriptionPackages,
  createSubscription,
  getUserSubscriptions,
  createPayment,
  uploadProofOfPayment,
  getActivityLogs,
  verifyPayment,
  createActivityLog
}; 