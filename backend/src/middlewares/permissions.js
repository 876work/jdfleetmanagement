const ADMIN_ONLY_MESSAGE = 'Admin access required for this action.';

export const isAdmin = (req) => req.user?.role === 'admin';
export const isStaff = (req) => req.user?.role === 'staff';

export const requireAdmin = (message = ADMIN_ONLY_MESSAGE) => (req, res, next) => {
  if (isAdmin(req)) return next();
  return res.status(403).json({ message });
};

export const denyStaff = (message) => (req, res, next) => {
  if (isStaff(req)) return res.status(403).json({ message });
  return next();
};

export const STAFF_ALLOWED_MAINTENANCE_STATUSES = ['scheduled', 'in progress'];
export const LOCKED_INVOICE_STATUSES = ['paid', 'cancelled'];

export const staffActionDenied = (resource, action = 'perform this action') =>
  `Staff users cannot ${action} ${resource}. Please contact an admin.`;
