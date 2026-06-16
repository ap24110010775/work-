import { subscriptionDao } from '../database/subscriptionDao.js';

export const subscriptionGuard = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Login required' });
  }

  const sub = await subscriptionDao.getActiveByUserId(req.user.id);

  if (!sub || sub.plan === 'free') {
    return res.status(403).json({
      success: false,
      error: 'UpgradeRequired',
      message: 'This feature requires a WorkYaar Pro subscription. Upgrade to unlock AI scoring, priority visibility, and more.',
      upgrade_url: '/api/v1/payments/create-order'
    });
  }

  // Attach subscription info to request context
  req.subscription = sub;
  next();
};
