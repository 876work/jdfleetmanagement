import express from 'express';
import { authorizeRoles } from '../middlewares/authMiddleware.js';
import { deleteUser, getUsers, updateUserRole } from '../controllers/userController.js';

const router = express.Router();

router.use(authorizeRoles('admin')); // Staff cannot access User Management or mutate users.

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
