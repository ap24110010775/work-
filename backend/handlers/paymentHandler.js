import { paymentService } from '../services/paymentService.js';
import { paymentTransformer } from '../transformations/paymentTransformer.js';

export const paymentHandler = {
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { plan } = req.body;

      const order = await paymentService.createOrder(userId, plan);

      return res.status(201).json({
        success: true,
        message: `Razorpay order created for ${order.planLabel}`,
        order
      });
    } catch (error) {
      console.error('Create order error:', error.message);
      return res.status(500).json({ success: false, error: 'PaymentError', message: error.message });
    }
  },

  async verifyPayment(req, res) {
    try {
      const userId = req.user.id;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body;

      const result = await paymentService.verifyAndActivate(
        userId, razorpayOrderId, razorpayPaymentId, razorpaySignature, plan
      );

      return res.json({
        success: true,
        message: `🎉 Welcome to WorkYaar Pro! Your ${result.planLabel} plan is now active.`,
        subscription: result
      });
    } catch (error) {
      console.error('Verify payment error:', error.message);
      return res.status(400).json({ success: false, error: 'PaymentError', message: error.message });
    }
  },

  async getSubscription(req, res) {
    try {
      const userId = req.user.id;
      const sub = await paymentService.getSubscription(userId);

      return res.json({
        success: true,
        subscription: paymentTransformer.toSubscriptionResponse(sub)
      });
    } catch (error) {
      console.error('Get subscription error:', error.message);
      return res.status(500).json({ success: false, error: 'PaymentError', message: error.message });
    }
  },

  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const payments = await paymentService.getPaymentHistory(userId);

      return res.json({
        success: true,
        payments: paymentTransformer.toPaymentHistoryResponse(payments)
      });
    } catch (error) {
      console.error('Payment history error:', error.message);
      return res.status(500).json({ success: false, error: 'PaymentError', message: error.message });
    }
  },

  async getOrderStatus(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.orderId;
      const status = await paymentService.getOrderStatus(userId, orderId);
      return res.json({ success: true, ...status });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
