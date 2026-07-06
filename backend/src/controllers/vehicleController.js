import Vehicle, { VEHICLE_STATUSES } from '../models/Vehicle.js';
import {
  isNonEmptyString,
  isValidObjectId,
  sendValidationError,
  publicErrorMessage
} from '../utils/validation.js';
import { denyStaff, isStaff } from '../utils/permissions.js';

const vehicleFields = [
  'name',
  'plateNumber',
  'brand',
  'model',
  'year',
  'categoryId',
  'ownerId',
  'status',
  'notes',
  'dateAdded'
];

const validateVehiclePayload = (body) => {
  const fields = {};

  if (!isNonEmptyString(body.plateNumber)) {
    fields.plateNumber = 'License plate is required.';
  }

  if (!isNonEmptyString(body.brand ?? body.make)) {
    fields.brand = 'Make is required.';
  }

  if (!isNonEmptyString(body.model)) {
    fields.model = 'Model is required.';
  }

  const year = Number(body.year);
  const maxYear = new Date().getFullYear() + 1;

  if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
    fields.year = `Year must be between 1900 and ${maxYear}.`;
  }

  if (!isValidObjectId(body.categoryId)) {
    fields.categoryId = 'Select a valid category.';
  }

  if (!isValidObjectId(body.ownerId)) {
    fields.ownerId = 'Select a valid owner.';
  }

  if (body.status && !VEHICLE_STATUSES.includes(body.status)) {
    fields.status = `Status must be one of: ${VEHICLE_STATUSES.join(', ')}.`;
  }

  return fields;
};

const buildVehiclePayload = (body) => {
  const payload = {};

  vehicleFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (body.make !== undefined && payload.brand === undefined) {
    payload.brand = body.make;
  }

  if (payload.year !== undefined) {
    payload.year = Number(payload.year);
  }

  if (payload.dateAdded === '') {
    delete payload.dateAdded;
  }

  if (payload.status === '') {
    delete payload.status;
  }

  return payload;
};

export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('ownerId categoryId')
      .sort({ dateAdded: -1, createdAt: -1 });

    res.json(vehicles);
  } catch (err) {
    res.status(500).json({
      message: 'Unable to load vehicles. Please try again.'
    });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const fields = validateVehiclePayload(req.body);

    if (Object.keys(fields).length) {
      return sendValidationError(
        res,
        'Please fix the highlighted vehicle fields.',
        fields
      );
    }

    const newVehicle = new Vehicle(buildVehiclePayload(req.body));
    const saved = await newVehicle.save();
    const populated = await saved.populate('ownerId categoryId');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({
      message: publicErrorMessage(
        err,
        'Vehicle could not be saved. Please check the form and try again.'
      ),
      allowedStatuses: VEHICLE_STATUSES
    });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      'ownerId categoryId'
    );

    if (!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({
      message: 'Unable to load vehicles. Please try again.'
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    if (isStaff(req)) {
      const requestedFields = Object.keys(req.body).filter(
        (field) => !['_id', 'status', 'notes'].includes(field)
      );

      if (requestedFields.length) {
        return denyStaff(
          res,
          'Staff users can only update vehicle status and notes. Please contact an admin for vehicle detail or ownership changes.'
        );
      }

      if (
        req.body.status !== undefined &&
        !VEHICLE_STATUSES.includes(req.body.status)
      ) {
        return res.status(400).json({
          message: `Status must be one of: ${VEHICLE_STATUSES.join(', ')}.`,
          allowedStatuses: VEHICLE_STATUSES
        });
      }

      const staffPayload = {};

      if (req.body.status !== undefined) {
        staffPayload.status = req.body.status;
      }

      if (req.body.notes !== undefined) {
        staffPayload.notes = req.body.notes;
      }

      const updated = await Vehicle.findByIdAndUpdate(
        req.params.id,
        staffPayload,
        { new: true, runValidators: true }
      ).populate('ownerId categoryId');

      if (!updated) {
        return res.status(404).json({
          message: 'Vehicle not found'
        });
      }

      return res.json(updated);
    }

    const fields = validateVehiclePayload(req.body);

    if (Object.keys(fields).length) {
      return sendValidationError(
        res,
        'Please fix the highlighted vehicle fields.',
        fields
      );
    }

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      buildVehiclePayload(req.body),
      { new: true, runValidators: true }
    ).populate('ownerId categoryId');

    if (!updated) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({
      message: publicErrorMessage(
        err,
        'Vehicle could not be updated. Please check the form and try again.'
      ),
      allowedStatuses: VEHICLE_STATUSES
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    if (isStaff(req)) {
      return denyStaff(res, 'Staff users cannot delete vehicles.');
    }

    const deleted = await Vehicle.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    res.json({
      message: 'Vehicle deleted'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Unable to delete vehicle. Please try again.'
    });
  }
};