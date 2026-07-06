// models/Vehicle.js
import mongoose from 'mongoose';

export const VEHICLE_STATUSES = ['active', 'inactive', 'maintenance', 'retired'];

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 120
  },
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 40
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleCategory',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  status: {
    type: String,
    enum: VEHICLE_STATUSES,
    default: 'active',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vehicleSchema.virtual('make').get(function getMake() {
  return this.brand;
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
