import Bill from "../models/Bill.js";
import MaintenanceRecord from "../models/MaintenanceRecord.js";
import Part from "../models/Part.js";
import {
  isNonEmptyString,
  isValidObjectId,
  publicErrorMessage,
} from "../utils/validation.js";
import { denyStaff, isStaff } from "../utils/permissions.js";

const PAYMENT_STATUSES = ["draft", "unpaid", "paid", "overdue", "cancelled"];
const STAFF_LOCKED_INVOICE_STATUSES = [
  "paid",
  "cancelled",
  "archived",
  "completed",
];

const totalsEqual = (a, b) =>
  Number(a || 0).toFixed(2) === Number(b || 0).toFixed(2);

const validateBillPayload = ({
  customer,
  vehicle,
  services = [],
  date,
  paymentStatus = "unpaid",
}) => {
  if (!isValidObjectId(customer)) return "Select a valid customer.";
  if (!isValidObjectId(vehicle)) return "Select a valid vehicle.";
  if (date && Number.isNaN(Date.parse(date))) return "Enter a valid invoice date.";

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    return "Payment status must be draft, unpaid, paid, overdue, or cancelled.";
  }

  if (!Array.isArray(services) || services.length === 0) {
    return "Add at least one service to the invoice.";
  }

  if (services.some((item) => !isNonEmptyString(item.description))) {
    return "Each invoice service needs a description.";
  }

  if (
    services.some(
      (item) => Number.isNaN(Number(item.price)) || Number(item.price) < 0
    )
  ) {
    return "Service prices must be non-negative numbers.";
  }

  return null;
};

export const createBill = async (req, res) => {
  try {
    const {
      customer,
      vehicle,
      services,
      date,
      maintenanceId,
      partsUsed = [],
      paymentStatus = "unpaid",
      notes = "",
    } = req.body;

    if (isStaff(req) && !["draft", "unpaid"].includes(paymentStatus)) {
      return denyStaff(
        res,
        "Staff users can only create draft or unpaid invoices. Please contact an admin."
      );
    }

    const validationError = validateBillPayload({
      customer,
      vehicle,
      services,
      date,
      paymentStatus,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanServices = services.map((item) => ({
      description: item.description.trim(),
      price: Number(item.price),
    }));

    const totalPrice = cleanServices.reduce(
      (sum, item) => sum + item.price,
      0
    );

    let maintenanceRef = maintenanceId;

    if (maintenanceRef) {
      await MaintenanceRecord.findByIdAndUpdate(maintenanceRef, { partsUsed });
    } else {
      const newMaint = await MaintenanceRecord.create({
        vehicleId: vehicle,
        serviceDate: date || new Date(),
        services: cleanServices.map((service) => ({
          description: service.description,
          cost: service.price,
        })),
        partsUsed,
      });

      maintenanceRef = newMaint._id;
    }

    if (partsUsed && partsUsed.length > 0) {
      for (const partId of partsUsed) {
        await Part.findByIdAndUpdate(partId, { $inc: { quantity: -1 } });
      }
    }

    const newBill = await Bill.create({
      customer,
      vehicle,
      services: cleanServices,
      totalPrice,
      date: date || new Date(),
      maintenanceId: maintenanceRef,
      paymentStatus,
      notes,
    });

    const populated = await Bill.findById(newBill._id)
      .populate("customer", "firstName lastName")
      .populate("vehicle", "model plateNumber brand")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Create Bill Error:", err);

    res.status(400).json({
      message: publicErrorMessage(
        err,
        "Invoice could not be created. Please check the form and try again."
      ),
    });
  }
};

export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find({ archived: false })
      .populate("customer", "firstName lastName")
      .populate("vehicle", "brand model plateNumber")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    res.status(200).json(bills);
  } catch (err) {
    console.error("Fetch Bills Error:", err);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};

export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("customer")
      .populate("vehicle")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBill = async (req, res) => {
  try {
    const {
      customer,
      vehicle,
      services = [],
      maintenanceId,
      partsUsed = [],
      date,
      paymentStatus,
      notes,
    } = req.body;

    const existingBill = await Bill.findById(req.params.id).lean();

    if (!existingBill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const finalPaymentStatus =
      paymentStatus || existingBill.paymentStatus || "unpaid";

    if (isStaff(req)) {
      const currentStatus = existingBill.archived
        ? "archived"
        : existingBill.paymentStatus || "unpaid";

      if (STAFF_LOCKED_INVOICE_STATUSES.includes(currentStatus)) {
        return denyStaff(
          res,
          "Staff users cannot edit paid, cancelled, archived, or completed invoices. Please contact an admin."
        );
      }

      if (finalPaymentStatus === "paid" && existingBill.paymentStatus !== "paid") {
        return denyStaff(
          res,
          "Staff users cannot mark invoices as paid. Please contact an admin."
        );
      }
    }

    const validationError = validateBillPayload({
      customer,
      vehicle,
      services,
      date,
      paymentStatus: finalPaymentStatus,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanServices = services.map((item) => ({
      description: item.description.trim(),
      price: Number(item.price),
    }));

    const totalPrice = cleanServices.reduce(
      (sum, item) => sum + item.price,
      0
    );

    if (isStaff(req) && !totalsEqual(existingBill.totalPrice, totalPrice)) {
      return denyStaff(
        res,
        "Staff users cannot change invoice amounts after creation. Please contact an admin."
      );
    }

    let oldParts = [];
    let newParts = [];

    try {
      if (maintenanceId) {
        const oldMaint = await MaintenanceRecord.findById(maintenanceId).lean();
        oldParts = (oldMaint?.partsUsed || []).map((part) => part.toString());
      }

      if (typeof partsUsed !== "undefined") {
        newParts = (partsUsed || []).map((part) => part.toString());
      } else if (maintenanceId) {
        const latestMaint = await MaintenanceRecord.findById(
          maintenanceId
        ).lean();

        newParts = (latestMaint?.partsUsed || []).map((part) =>
          part.toString()
        );
      }
    } catch (err) {
      console.error(
        "Failed reading maintenance parts for inventory diff:",
        err?.message
      );
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        customer,
        vehicle,
        services: cleanServices,
        totalPrice,
        ...(date ? { date } : {}),
        paymentStatus: finalPaymentStatus,
        ...(typeof notes === "string" ? { notes } : {}),
      },
      { new: true }
    );

    if (maintenanceId) {
      await MaintenanceRecord.findByIdAndUpdate(
        maintenanceId,
        {
          ...(date ? { serviceDate: date } : {}),
          services: cleanServices.map((service) => ({
            description: service.description,
            cost: service.price,
          })),
          partsUsed,
        },
        { new: true }
      );
    }

    try {
      for (const partId of newParts) {
        if (!oldParts.includes(partId)) {
          await Part.findByIdAndUpdate(partId, { $inc: { quantity: -1 } });
        }
      }

      for (const partId of oldParts) {
        if (!newParts.includes(partId)) {
          await Part.findByIdAndUpdate(partId, { $inc: { quantity: 1 } });
        }
      }
    } catch (invErr) {
      console.error("⚠️ Inventory update bill failed:", invErr?.message);
    }

    const populated = await Bill.findById(updatedBill._id)
      .populate("customer", "firstName lastName")
      .populate("vehicle", "model plateNumber brand")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    res.json(populated);
  } catch (err) {
    console.error("Update Bill Error:", err);

    res.status(400).json({
      message: publicErrorMessage(
        err,
        "Invoice could not be updated. Please check the form and try again."
      ),
    });
  }
};

export const deleteBill = async (req, res) => {
  try {
    if (isStaff(req)) {
      return denyStaff(res, "Staff users cannot delete invoices.");
    }

    const bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getBillByMaintenanceId = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      maintenanceId: req.params.maintenanceId,
      archived: false,
    })
      .populate("vehicle")
      .populate("customer")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    if (!bill) {
      return res
        .status(404)
        .json({ message: "Invoice not found for this maintenance" });
    }

    res.json(bill);
  } catch (error) {
    console.error("❌ Error fetching bill by maintenanceId:", error);

    res.status(500).json({
      message: "Unable to load invoice. Please try again.",
    });
  }
};

export const getArchivedBills = async (req, res) => {
  try {
    console.log("📥 Request received for archived bills");

    const bills = await Bill.find({ archived: true })
      .populate("vehicle", "brand model plateNumber")
      .populate("customer", "firstName lastName")
      .populate({
        path: "maintenanceId",
        populate: { path: "partsUsed" },
      });

    console.log("Archived bills fetched:", bills.length);

    res.json(bills);
  } catch (err) {
    console.error("❌ Error fetching archived bills:", err);

    res.status(500).json({
      message: "Unable to load archived invoices. Please try again.",
    });
  }
};

export const archiveBill = async (req, res) => {
  try {
    if (isStaff(req)) {
      return denyStaff(res, "Staff users cannot archive invoices.");
    }

    const updated = await Bill.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Archive Bill Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecentBills = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 5, 50));

    const bills = await Bill.find({ archived: false })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate("customer", "firstName lastName")
      .populate("vehicle", "brand model plateNumber");

    res.json(bills);
  } catch (err) {
    console.error("❌ Error fetching recent bills:", err);

    res.status(500).json({
      message: "Unable to load recent invoices. Please try again.",
    });
  }
};