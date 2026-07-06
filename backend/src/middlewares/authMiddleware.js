import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and has Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user data to request
    next(); // Continue to the route
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

const authorizeRoles = (...allowedRoles) => async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    let role = req.user.role;

    if (!allowedRoles.includes(role)) {
      const user = await User.findById(req.user.id).select('role');
      role = user?.role;

      if (role) {
        req.user.role = role;
      }
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
};

export { authMiddleware, authorizeRoles };
