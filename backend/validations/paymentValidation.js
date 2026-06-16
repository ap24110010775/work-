export const paymentValidation = {
  validateCreateOrder(req, res, next) {
    const { plan } = req.body;
    const validPlans = ['pro_monthly', 'pro_yearly'];
    
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `Invalid plan. Choose one of: ${validPlans.join(', ')}`
      });
    }
    next();
  },

  validateVerifyPayment(req, res, next) {
    const { razorpayOrderId, razorpayPaymentId, plan } = req.body;

    if (!razorpayOrderId) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'razorpayOrderId is required' });
    }
    if (!razorpayPaymentId) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'razorpayPaymentId is required' });
    }
    if (!plan) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'plan is required' });
    }
    next();
  }
};
