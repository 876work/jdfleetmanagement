import express from 'express';
import { createCategory, getCategories } from '../controllers/vehicleCategoryController.js';
import { requireAdmin } from '../middlewares/permissions.js';

const router = express.Router();

router.post('/', requireAdmin('Staff users cannot access category management. Please contact an admin.'), createCategory);
router.get('/', getCategories);

export default router;
