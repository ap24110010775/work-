import Razorpay from 'razorpay';
import crypto from 'crypto';
import { paymentDao } from '../database/paymentDao.js';
import { subscriptionDao } from '../database/subscriptionDao.js';

const PLANS = {
  pro_monthly: { amount: 49900, duration_days: 30, label: 'Pro Monthly' },   // ₹499
  pro_yearly:  { amount: 399900, duration_days: 365, label: 'Pro Yearly' }   // ₹3,999
};

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null; // Will use mock mode
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const paymentService = {
  async createOrder(userId, planType) {
    const plan = PLANS[planType];
    if (!plan) throw new Error(`Invalid plan type: ${planType}. Use 'pro_monthly' or 'pro_yearly'.`);

    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      // Mock mode — no Razorpay keys configured
      const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await paymentDao.create(userId, mockOrderId, plan.amount / 100);

      console.log(`\n========================================`);
      console.log(`💳 MOCK RAZORPAY ORDER CREATED`);
      console.log(`   Order ID: ${mockOrderId}`);
      console.log(`   Amount: ₹${plan.amount / 100}`);
      console.log(`   Plan: ${plan.label}`);
      console.log(`========================================\n`);

      return {
        orderId: mockOrderId,
        amount: plan.amount,
        currency: 'INR',
        planLabel: plan.label,
        keyId: 'rzp_test_mock',
        mock: true
      };
    }

    // Real Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `workyaar_${userId}_${Date.now()}`,
      notes: { userId: String(userId), plan: planType }
    });

    await paymentDao.create(userId, order.id, plan.amount / 100);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planLabel: plan.label,
      keyId: process.env.RAZORPAY_KEY_ID,
      mock: false
    };
  },

  async verifyAndActivate(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature, planType) {
    const plan = PLANS[planType];
    if (!plan) throw new Error('Invalid plan type');

    const payment = await paymentDao.getByOrderId(razorpayOrderId);
    if (!payment) throw new Error('Payment order not found');

    if (Number(payment.user_id) !== Number(userId)) {
      throw new Error('Payment order does not belong to this account');
    }

    if (payment.status === 'paid') {
      const sub = await subscriptionDao.getActiveByUserId(userId);
      return {
        alreadyPaid: true,
        subscriptionId: sub?.id,
        plan: sub?.plan || planType,
        planLabel: plan.label,
        expiresAt: sub?.expires_at,
        status: 'paid',
      };
    }

    const razorpay = getRazorpayInstance();

    if (razorpay) {
      // Verify cryptographic signature
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        await paymentDao.markFailed(razorpayOrderId);
        throw new Error('Payment signature verification failed');
      }
    }

    // Calculate expiry
    const expiresAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000);

    // Create subscription
    const subscriptionId = await subscriptionDao.create(userId, planType, expiresAt);

    // Link payment to subscription
    await paymentDao.markPaid(razorpayOrderId, razorpayPaymentId || 'mock_payment', razorpaySignature || 'mock_sig', subscriptionId);

    return {
      subscriptionId,
      plan: planType,
      planLabel: plan.label,
      expiresAt,
      status: 'paid',
    };
  },

  async getOrderStatus(userId, razorpayOrderId) {
    const payment = await paymentDao.getByOrderId(razorpayOrderId);
    if (!payment) throw new Error('Payment order not found');
    if (Number(payment.user_id) !== Number(userId)) {
      throw new Error('Payment order does not belong to this account');
    }

    const sub = payment.subscription_id
      ? await subscriptionDao.getById(payment.subscription_id)
      : await subscriptionDao.getActiveByUserId(userId);

    return {
      orderId: payment.razorpay_order_id,
      status: payment.status,
      amountInr: payment.amount_inr,
      paymentId: payment.razorpay_payment_id,
      subscription: sub
        ? { plan: sub.plan, status: sub.status, expiresAt: sub.expires_at }
        : null,
    };
  },

  async getSubscription(userId) {
    const sub = await subscriptionDao.getActiveByUserId(userId);
    if (!sub) {
      return { plan: 'free', status: 'active', expiresAt: null };
    }
    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      startsAt: sub.starts_at,
      expiresAt: sub.expires_at
    };
  },

  async getPaymentHistory(userId) {
    return await paymentDao.getByUserId(userId);
  }
};
