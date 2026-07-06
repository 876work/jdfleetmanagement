import User from '../models/User.js';

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ username: 1 });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or staff' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role', error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};
