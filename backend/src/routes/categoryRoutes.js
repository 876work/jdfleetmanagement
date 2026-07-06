import express from 'express';
import { createCategory, getCategories } from '../controllers/vehicleCategoryController.js';
import { requireAdminAction } from '../utils/permissions.js';

const router = express.Router();

router.post('/', requireAdminAction, createCategory);
router.get('/', getCategories);

export default router;
