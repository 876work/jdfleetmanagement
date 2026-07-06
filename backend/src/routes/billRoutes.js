import express from 'express';
import {
    createBill,
    getAllBills,
    getBillById,
    updateBill,
    deleteBill,
    getBillByMaintenanceId,
    getArchivedBills,
    archiveBill,
    getRecentBills,
} from '../controllers/billController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import { denyStaff } from '../middlewares/permissions.js';

const router = express.Router();

router.post('/', authMiddleware, createBill);
router.get('/', authMiddleware, getAllBills);

router.get("/recent", getRecentBills);
router.get("/archived", getArchivedBills);
router.get("/by-maintenance/:maintenanceId", getBillByMaintenanceId);

router.get('/:id', getBillById);
router.put('/:id', authMiddleware, updateBill);
router.delete('/:id', authMiddleware, denyStaff('Staff users cannot delete invoices. Please contact an admin.'), deleteBill);
router.patch('/:id/archive', authMiddleware, denyStaff('Staff users cannot archive invoices. Please contact an admin.'), archiveBill);

export default router;
