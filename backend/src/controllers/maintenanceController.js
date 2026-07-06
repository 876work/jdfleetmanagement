import MaintenanceRecord from "../models/MaintenanceRecord.js";
import Vehicle from "../models/Vehicle.js";
import Bill from "../models/Bill.js";
import Part from "../models/Part.js";
import {
  isNonEmptyString,
  isValidObjectId,
  publicErrorMessage,
} from "../utils/validation.js";
import { denyStaff, isStaff } from "../utils/permissions.js";

const VALID_MAINTENANCE_STATUSES = [
  "scheduled",
  "in progress",
  "completed",
  "cancelled",
];

const STAFF_ALLOWED_MAINTENANCE_STATUSES = ["scheduled", "in progress"];

const normalizeOptionalDate = (value) => value || undefined;

const normalizeMaintenancePayload = (body) => {
  const services = Array.isArray(body.services) ? body.services : [];

  const normalizedServices = services
    .map((service) => ({
      description: service.description?.trim(),
      cost: Number(service.cost),
    }))
    .filter((service) => service.description);

  return {
    vehicleId: body.vehicleId,
    serviceDate: body.serviceDate,
    maintenanceType: body.maintenanceType?.trim() || "General Maintenance",
    status: body.status || "completed",
    vendorName: body.vendorName?.trim() || "",
    notes: body.notes?.trim() || "",
    nextServiceDate: normalizeOptionalDate(body.nextServiceDate),
    odometerReading:
      body.odometerReading === "" ||
      body.odometerReading === undefined ||
      body.odometerReading === null
        ? undefined
        : Number(body.odometerReading),
    services: normalizedServices,
    partsUsed: Array.isArray(body.partsUsed) ? body.partsUsed : [],
  };
};

const validateMaintenancePayload = ({
  vehicleId,
  serviceDate,
  status,
  odometerReading,
  services,
  nextServiceDate,
}) => {
  if (!isValidObjectId(vehicleId)) {
    return "Select a valid vehicle.";
  }

  if (!serviceDate || Number.isNaN(Date.parse(serviceDate))) {
    return "Enter a valid maintenance date.";
  }

  if (nextServiceDate && Number.isNaN(Date.parse(nextServiceDate))) {
    return "Enter a valid next service date.";
  }

  if (!services.length) {
    return "Add at least one service with a description and cost.";
  }

  if (services.some((service) => !isNonEmptyString(service.description))) {
    return "Each service needs a description.";
  }

  if (!VALID_MAINTENANCE_STATUSES.includes(status)) {
    return "Status must be scheduled, in progress, completed, or cancelled.";
  }

  if (
    odometerReading !== undefined &&
    (Number.isNaN(odometerReading) || odometerReading < 0)
  ) {
    return "Odometer reading must be a non-negative number.";
  }

  if (
    services.some(
      (service) => Number.isNaN(service.cost) || service.cost < 0
    )
  ) {
    return "Service costs must be non-negative numbers.";
  }

  return null;
};

export const createMaintenanceRecord = async (req, res) => {
  try {
    const payload = normalizeMaintenancePayload(req.body);
    const validationError = validateMaintenancePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { vehicleId, serviceDate, services, partsUsed } = payload;

    const newRecord = new MaintenanceRecord(payload);
    const savedRecord = await newRecord.save();
    const populatedRecord = await savedRecord.populate("vehicleId partsUsed");

    if (partsUsed && partsUsed.length > 0) {
      for (const partId of partsUsed) {
        await Part.findByIdAndUpdate(partId, {
          $inc: { quantity: -1 },
        });
      }
    }

    const vehicle = await Vehicle.findById(vehicleId).populate("ownerId");

    if (!vehicle || !vehicle.ownerId) {
      return res.status(400).json({
        message: "Vehicle or owner not found",
      });
    }

    const totalPrice = services.reduce((sum, service) => {
      return sum + service.cost;
    }, 0);

    const newBill = new Bill({
      vehicle: vehicle._id,
      customer: vehicle.ownerId._id,
      maintenanceId: savedRecord._id,
      services: services.map((service) => ({
        description: service.description,
        price: service.cost,
      })),
      totalPrice,
      date: serviceDate,
    });

    await newBill.save();

    console.log("Auto-created invoice:", newBill._id);

    res.status(201).json(populatedRecord);
  } catch (error) {
    console.error("❌ Error creating maintenance record and bill:", error);

    res.status(400).json({
      message: publicErrorMessage(
        error,
        "Maintenance record could not be saved. Please check the form and try again."
      ),
    });
  }
};

export const deleteMaintenance = async (req, res) => {
  try {
    if (isStaff(req)) {
      return denyStaff(
        res,
        "Staff users cannot delete maintenance records."
      );
    }

    const deleted = await MaintenanceRecord.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    await Bill.findOneAndUpdate(
      { maintenanceId: req.params.id },
      { archived: true }
    );

    console.log("Archived related invoice for maintenance:", req.params.id);

    res.json({
      message: "Maintenance deleted, and related invoice archived",
    });
  } catch (error) {
    console.error("❌ Error deleting maintenance:", error);

    res.status(500).json({
      message: "Unable to delete maintenance record. Please try again.",
    });
  }
};

export const getAllMaintenanceRecords = async (req, res) => {
  try {
    const records = await MaintenanceRecord.find()
      .populate("vehicleId")
      .populate({
        path: "partsUsed",
        select: "name",
      });

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Unable to load maintenance records. Please try again.",
    });
  }
};

export const getMaintenanceById = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id)
      .populate("vehicleId")
      .populate("partsUsed");

    if (!record) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    res.json(record);
  } catch (error) {
    console.error("❌ Error fetching maintenance record:", error);

    res.status(400).json({
      message: publicErrorMessage(
        error,
        "Maintenance record could not be saved. Please check the form and try again."
      ),
    });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const oldRecord = await MaintenanceRecord.findById(req.params.id).lean();

    if (!oldRecord) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    if (
      isStaff(req) &&
      !STAFF_ALLOWED_MAINTENANCE_STATUSES.includes(
        oldRecord.status || "completed"
      )
    ) {
      return denyStaff(
        res,
        "Staff users can only update maintenance records while they are scheduled or in progress. Please contact an admin."
      );
    }

    const payload = normalizeMaintenancePayload(req.body);
    const validationError = validateMaintenancePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { serviceDate, services, partsUsed } = payload;

    const oldParts = (oldRecord.partsUsed || []).map((part) =>
      part.toString()
    );

    const newParts = (partsUsed || []).map((part) => part.toString());

    const updated = await MaintenanceRecord.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    )
      .populate("vehicleId")
      .populate("partsUsed");

    if (!updated) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    const totalPrice = services.reduce((sum, service) => {
      return sum + service.cost;
    }, 0);

    const bill = await Bill.findOneAndUpdate(
      { maintenanceId: updated._id },
      {
        services: services.map((service) => ({
          description: service.description,
          price: service.cost,
        })),
        totalPrice,
        date: serviceDate,
      },
      { new: true }
    );

    console.log("Updated related invoice:", bill?._id);

    try {
      for (const partId of newParts) {
        if (!oldParts.includes(partId)) {
          await Part.findByIdAndUpdate(partId, {
            $inc: { quantity: -1 },
          });
        }
      }

      for (const partId of oldParts) {
        if (!newParts.includes(partId)) {
          await Part.findByIdAndUpdate(partId, {
            $inc: { quantity: 1 },
          });
        }
      }
    } catch (invErr) {
      console.error(
        "⚠️ Inventory update maintenance failed:",
        invErr?.message
      );
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating maintenance record:", error);

    res.status(400).json({
      message: publicErrorMessage(
        error,
        "Maintenance record could not be saved. Please check the form and try again."
      ),
    });
  }
};

export const getRecentMaintenances = async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit) || 5, 50)
    );

    const records = await MaintenanceRecord.find()
      .sort({ serviceDate: -1, createdAt: -1 })
      .limit(limit)
      .populate("vehicleId", "plateNumber brand model")
      .populate({
        path: "partsUsed",
        select: "name",
      });

    return res.json(records);
  } catch (error) {
    console.error("❌ Error fetching recent maintenances:", error);

    return res.status(400).json({
      message: publicErrorMessage(
        error,
        "Maintenance record could not be saved. Please check the form and try again."
      ),
    });
  }
};