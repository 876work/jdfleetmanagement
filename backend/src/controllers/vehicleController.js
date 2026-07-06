import Vehicle, { VEHICLE_STATUSES } from '../models/Vehicle.js';

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/vehicles → Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const newVehicle = new Vehicle(buildVehiclePayload(req.body));
    const saved = await newVehicle.save();
    const populated = await saved.populate('ownerId categoryId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message, allowedStatuses: VEHICLE_STATUSES });
  }
};

// GET /api/vehicles/:id → Get vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('ownerId categoryId');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/vehicles/:id → Update a vehicle
export const updateVehicle = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      buildVehiclePayload(req.body),
      { new: true, runValidators: true }
    ).populate('ownerId categoryId');
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Invalid update', error: err.message, allowedStatuses: VEHICLE_STATUSES });
  }
};

// DELETE /api/vehicles/:id → Delete a vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
