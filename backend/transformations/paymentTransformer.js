export const paymentTransformer = {
  toSubscriptionResponse(sub) {
    if (!sub) return { plan: 'free', status: 'active', isPro: false };
    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      isPro: sub.plan !== 'free' && sub.status === 'active',
      startsAt: sub.startsAt || sub.starts_at,
      expiresAt: sub.expiresAt || sub.expires_at
    };
  },

  toPaymentHistoryResponse(payments) {
    return payments.map(p => ({
      id: p.id,
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      amount: p.amount_inr,
      currency: p.currency,
      status: p.status,
      createdAt: p.created_at
    }));
  }
};
