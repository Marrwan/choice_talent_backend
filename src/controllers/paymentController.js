const https = require('https');
const { Plan, Subscription, User } = require('../models');
const { createError } = require('../utils/errorUtils');
const { authenticateToken: protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Get all subscription plans
 */
const getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.findAll({
      order: [['price', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize a payment with Paystack
 */
const initializePayment = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!planId) {
      return next(createError(400, 'Plan ID is required'));
    }

    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return next(createError(404, 'Plan not found'));
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      where: { 
        userId,
        status: 'active',
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (existingSubscription) {
      return next(createError(400, 'You already have an active subscription'));
    }

    const params = JSON.stringify({
      email: email,
      amount: plan.price,
      currency: 'NGN',
      callback_url: `${process.env.FRONTEND_URL}/dashboard/subscription?reference={{reference}}`,
      metadata: {
        userId: userId,
        planId: plan.id,
        planName: plan.name,
      },
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const clientReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', chunk => {
        data += chunk;
      });
      apiRes.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status) {
            res.status(200).json(response);
          } else {
            next(createError(500, 'Failed to initialize payment'));
          }
        } catch (parseError) {
          next(createError(500, 'Invalid response from payment gateway'));
        }
      });
    }).on('error', error => {
      console.error('Paystack API error:', error);
      next(createError(500, 'Failed to initialize payment'));
    });

    clientReq.write(params);
    clientReq.end();

  } catch (error) {
    next(error);
  }
};

/**
 * Verify a payment with Paystack
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    if (!reference) {
      return next(createError(400, 'Payment reference is required'));
    }

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    };

    const clientReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', chunk => {
        data += chunk;
      });
      apiRes.on('end', async () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status && response.data.status === 'success') {
            const { userId: paymentUserId, planId } = response.data.metadata;
            
            // Verify the payment is for the correct user
            if (paymentUserId !== userId) {
              return next(createError(403, 'Payment verification failed - user mismatch'));
            }

            const plan = await Plan.findByPk(planId);
            if (!plan) {
              return next(createError(404, 'Plan not found'));
            }

            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + plan.duration);

            // Create or update subscription
            await Subscription.upsert({
              userId,
              planId,
              expiresAt,
              status: 'active',
            });

            // Update user subscription status
            const user = await User.findByPk(userId);
            if (user) {
              await user.updateSubscriptionStatus('premium');
              
              // Send subscription activation email
              try {
                await emailService.sendSubscriptionActivation(
                  user.email, 
                  user.name, 
                  plan.name, 
                  expiresAt
                );
              } catch (emailError) {
                console.error('Failed to send subscription activation email:', emailError);
                // Don't fail the payment verification if email fails
              }
            }

            res.status(200).json({
              success: true,
              message: 'Payment verified and subscription activated successfully',
              data: {
                plan: plan.name,
                expiresAt: expiresAt.toISOString(),
                status: 'active'
              }
            });
          } else {
            res.status(400).json({
              success: false,
              message: 'Payment verification failed',
              data: response.data
            });
          }
        } catch (parseError) {
          next(createError(500, 'Invalid response from payment gateway'));
        }
      });
    }).on('error', error => {
      console.error('Paystack API error:', error);
      next(createError(500, 'Failed to verify payment'));
    });

    clientReq.end();

  } catch (error) {
    next(error);
  }
};

/**
 * Get user's current subscription
 */
const getCurrentSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: { 
        userId,
        status: 'active',
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      },
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        subscription,
        isActive: !!subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: { 
        userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return next(createError(404, 'No active subscription found'));
    }

    await subscription.update({ status: 'cancelled' });

    // Update user subscription status
    const user = await User.findByPk(userId);
    if (user) {
      await user.updateSubscriptionStatus('free');
    }

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  initializePayment,
  verifyPayment,
  getCurrentSubscription,
  cancelSubscription
}; 