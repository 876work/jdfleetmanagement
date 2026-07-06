import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { isNonEmptyString, sendValidationError, publicErrorMessage } from '../utils/validation.js';

const validateCredentials = ({ username, passwordHash }) => {
  const fields = {};
  if (!isNonEmptyString(username)) fields.username = 'Username is required.';
  if (!isNonEmptyString(passwordHash)) fields.password = 'Password is required.';
  if (isNonEmptyString(username) && username.trim().length < 3) fields.username = 'Username must be at least 3 characters.';
  if (isNonEmptyString(passwordHash) && passwordHash.length < 6) fields.password = 'Password must be at least 6 characters.';
  return fields;
};

const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '2d' }
);

export const register = async (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    const fields = validateCredentials({ username, passwordHash });
    if (Object.keys(fields).length) return sendValidationError(res, 'Please fix the highlighted registration fields.', fields);

    const cleanUsername = username.trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) return sendValidationError(res, 'Username already exists.', { username: 'Choose a different username.' });

    const user = new User({ username: cleanUsername, passwordHash, role: 'staff' });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Registration failed:', publicErrorMessage(err, 'Registration failed.'));
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    const fields = validateCredentials({ username, passwordHash });
    if (Object.keys(fields).length) return sendValidationError(res, 'Please enter your username and password.', fields);

    const user = await User.findOne({ username: username.trim() });
    if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

    const isMatch = await user.comparePassword(passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid username or password.' });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login failed:', publicErrorMessage(err, 'Login failed.'));
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};
