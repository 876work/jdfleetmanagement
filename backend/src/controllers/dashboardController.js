import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Part from '../models/Part.js';
import Vehicle from '../models/Vehicle.js';

const clampLimit = (value, fallback = 5, max = 50) => Math.max(1, Math.min(parseInt(value, 10) || fallback, max));

const formatVehicleName = (vehicle) => {
    if (!vehicle) return 'Unknown vehicle';
    return [vehicle.brand, vehicle.model, vehicle.plateNumber].filter(Boolean).join(' • ') || 'Unnamed vehicle';
};

// GET /api/dashboard/summary
export const getDashboardSummary = async (req, res) => {
    try {
        const recentLimit = clampLimit(req.query.limit, 5);
        const lowStockThreshold = Math.max(0, parseInt(req.query.lowStockThreshold, 10) || 5);
        const attentionDays = Math.max(1, parseInt(req.query.attentionDays, 10) || 180);
        const attentionSince = new Date(Date.now() - attentionDays * 24 * 60 * 60 * 1000);

        const [
            totalVehicles,
            totalCustomers,
            totalMaintenanceRecords,
            totalInvoices,
            recentMaintenance,
            recentInvoices,
            lowStockParts,
            vehicles,
            maintenanceRecords,
        ] = await Promise.all([
            Vehicle.countDocuments(),
            Customer.countDocuments(),
            MaintenanceRecord.countDocuments(),
            Bill.countDocuments({ archived: false }),
            MaintenanceRecord.find()
                .sort({ serviceDate: -1, createdAt: -1 })
                .limit(recentLimit)
                .populate('vehicleId', 'plateNumber brand model')
                .populate({ path: 'partsUsed', select: 'name' })
                .lean(),
            Bill.find({ archived: false })
                .sort({ date: -1, createdAt: -1 })
                .limit(recentLimit)
                .populate('customer', 'firstName lastName')
                .populate('vehicle', 'brand model plateNumber')
                .lean(),
            Part.find({ quantity: { $lt: lowStockThreshold } })
                .sort({ quantity: 1, name: 1 })
                .limit(recentLimit)
                .lean(),
            Vehicle.find()
                .select('brand model plateNumber ownerId')
                .populate('ownerId', 'firstName lastName')
                .lean(),
            MaintenanceRecord.find()
                .select('vehicleId serviceDate createdAt')
                .sort({ serviceDate: -1, createdAt: -1 })
                .lean(),
        ]);

        const latestMaintenanceByVehicle = new Map();
        for (const record of maintenanceRecords) {
            const vehicleId = record.vehicleId?.toString();
            if (vehicleId && !latestMaintenanceByVehicle.has(vehicleId)) {
                latestMaintenanceByVehicle.set(vehicleId, record);
            }
        }

        const vehiclesNeedingAttention = vehicles
            .map((vehicle) => {
                const latestMaintenance = latestMaintenanceByVehicle.get(vehicle._id.toString());
                const lastServiceDate = latestMaintenance?.serviceDate || null;
                const needsAttention = !lastServiceDate || new Date(lastServiceDate) < attentionSince;

                if (!needsAttention) return null;

                return {
                    _id: vehicle._id,
                    vehicle,
                    title: formatVehicleName(vehicle),
                    reason: lastServiceDate
                        ? `No service recorded in ${attentionDays}+ days`
                        : 'No maintenance records found',
                    lastServiceDate,
                };
            })
            .filter(Boolean)
            .slice(0, recentLimit);

        res.json({
            counts: {
                vehicles: totalVehicles,
                customers: totalCustomers,
                maintenanceRecords: totalMaintenanceRecords,
                invoices: totalInvoices,
            },
            recentMaintenance,
            recentInvoices,
            vehiclesNeedingAttention,
            lowStockParts,
            settings: {
                lowStockThreshold,
                attentionDays,
            },
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ message: 'Failed to load dashboard summary', error: error.message });
    }
};
