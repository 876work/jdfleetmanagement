// backend/src/routes/partRoutes.js
import express from "express";
import {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  addPartOrder,
  getLowStockParts,
  deletePart,
} from "../controllers/partController.js";

import { denyStaff } from "../middlewares/permissions.js";

const router = express.Router();

router.post(
  "/",
  denyStaff("Staff users cannot create parts. Please contact an admin."),
  createPart
);

router.get("/", getAllParts);

router.get("/low-stock", getLowStockParts);

router.get("/:id", getPartById);

router.put(
  "/:id",
  denyStaff(
    "Staff users cannot edit parts or change inventory stock quantities. Please contact an admin."
  ),
  updatePart
);

router.delete(
  "/:id",
  denyStaff("Staff users cannot delete parts. Please contact an admin."),
  deletePart
);

router.post(
  "/:id/order",
  denyStaff(
    "Staff users cannot directly change inventory stock quantities. Please contact an admin."
  ),
  addPartOrder
);

export default router;