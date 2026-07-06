import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true
  },
  serviceDate: {
    type: Date,
    required: true
  },
  maintenanceType: {
    type: String,
    trim: true,
    default: "General Maintenance"
  },
  status: {
    type: String,
    enum: ["scheduled", "in progress", "completed", "cancelled"],
    default: "completed"
  },
  vendorName: {
    type: String,
    trim: true,
    default: ""
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  nextServiceDate: {
    type: Date
  },
  odometerReading: {
    type: Number,
    min: 0
  },
  services: [
    {
      description: { type: String, required: true },
      cost: { type: Number, required: true, min: 0 }
    }
  ],
  partsUsed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part"
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model("MaintenanceRecord", maintenanceSchema);
