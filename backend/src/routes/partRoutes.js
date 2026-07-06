// backend/src/routes/partRoutes.js
import express from "express";
import * as partController from "../controllers/partController.js";

const router = express.Router();

router.post("/", partController.createPart);
router.get("/", partController.getAllParts);
router.get("/low-stock", partController.getLowStockParts);
router.get("/:id", partController.getPartById);
router.put("/:id", partController.updatePart);
router.delete("/:id", partController.deletePart);

//record purchase order & increase stock
router.post("/:id/order", partController.addPartOrder);

export default router;
