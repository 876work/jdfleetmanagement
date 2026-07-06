// backend/src/routes/customerRoutes.js
import express from 'express';
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} from '../controllers/customerController.js';
import { denyStaff } from '../middlewares/permissions.js';

const router = express.Router();

// CRUD routes
router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', denyStaff('Staff users cannot delete customers or owners. Please contact an admin.'), deleteCustomer);

export default router;
