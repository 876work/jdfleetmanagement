import Vehicle, { VEHICLE_STATUSES } from '../models/Vehicle.js';
import { isNonEmptyString, isValidObjectId, sendValidationError, publicErrorMessage } from '../utils/validation.js';

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
  if (!isNonEmptyString(body.plateNumber)) fields.plateNumber = 'License plate is required.';
  if (!isNonEmptyString(body.brand ?? body.make)) fields.brand = 'Make is required.';
  if (!isNonEmptyString(body.model)) fields.model = 'Model is required.';
  const year = Number(body.year);
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1900 || year > maxYear) fields.year = `Year must be between 1900 and ${maxYear}.`;
  if (!isValidObjectId(body.categoryId)) fields.categoryId = 'Select a valid category.';
  if (!isValidObjectId(body.ownerId)) fields.ownerId = 'Select a valid owner.';
  if (body.status && !VEHICLE_STATUSES.includes(body.status)) fields.status = `Status must be one of: ${VEHICLE_STATUSES.join(', ')}.`;
  return fields;
};

const buildVehiclePayload = (body) => {
  const payload = {};

  vehicleFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
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

// GET /api/vehicles → Get all vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('ownerId categoryId').sort({ dateAdded: -1, createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load vehicles. Please try again.' });
  }
};

// POST /api/vehicles → Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const fields = validateVehiclePayload(req.body);
    if (Object.keys(fields).length) return sendValidationError(res, 'Please fix the highlighted vehicle fields.', fields);
    const newVehicle = new Vehicle(buildVehiclePayload(req.body));
    const saved = await newVehicle.save();
    const populated = await saved.populate('ownerId categoryId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: publicErrorMessage(err, 'Vehicle could not be saved. Please check the form and try again.'), allowedStatuses: VEHICLE_STATUSES });
  }
};

// GET /api/vehicles/:id → Get vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('ownerId categoryId');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load vehicles. Please try again.' });
  }
};

// PUT /api/vehicles/:id → Update a vehicle
export const updateVehicle = async (req, res) => {
  try {
    const fields = validateVehiclePayload(req.body);
    if (Object.keys(fields).length) return sendValidationError(res, 'Please fix the highlighted vehicle fields.', fields);
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      buildVehiclePayload(req.body),
      { new: true, runValidators: true }
    ).populate('ownerId categoryId');
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: publicErrorMessage(err, 'Vehicle could not be updated. Please check the form and try again.'), allowedStatuses: VEHICLE_STATUSES });
  }
};

// DELETE /api/vehicles/:id → Delete a vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Unable to load vehicles. Please try again.' });
  }
};
