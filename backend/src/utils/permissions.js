export const ADMIN_ONLY_MESSAGE = 'Admin access required for this action.';
export const STAFF_RESTRICTED_MESSAGE = 'Staff users do not have permission to perform this action.';

export const isAdmin = (req) => req.user?.role === 'admin';
export const isStaff = (req) => req.user?.role === 'staff';

export const denyStaff = (res, message = STAFF_RESTRICTED_MESSAGE) =>
  res.status(403).json({ message });

export const requireAdminAction = (req, res, next) => {
  if (isAdmin(req)) return next();
  return denyStaff(res, ADMIN_ONLY_MESSAGE);
};
