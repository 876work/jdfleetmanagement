import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axiosInstance";
//import { AnimatePresence, motion } from "framer-motion";
import ConfirmModal from "../components/ConfirmModal";
import AddMaintenanceModal from "../components/AddMaintenanceModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import InvoiceModal from "../components/InvoiceModal";
import { AnimatePresence } from "framer-motion";


export default function MaintenanceList() {
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [recordToDelete, _setRecordToDelete] = useState(null);
    const navigate = useNavigate();
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [vehicleFilter, setVehicleFilter] = useState("");

    const fetchRecords = async () => {
        try {
            const res = await axios.get("/api/maintenance");
            setRecords(res.data);
        } catch (err) {
            toast.error("Failed to fetch maintenance records");
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await axios.get("/api/vehicles");
            setVehicles(res.data);
        } catch (err) {
            toast.error("Failed to fetch vehicles");
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchVehicles();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const statusOptions = useMemo(() => (
        [...new Set(records.map(record => (record.status || "completed").trim()).filter(Boolean))].sort()
    ), [records]);

    const filteredRecords = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return records.filter((record) => {
            const vehicle = record.vehicleId;
            const searchableText = [
                vehicle?.name,
                vehicle?.brand,
                vehicle?.model,
                vehicle?.plateNumber,
                record.maintenanceType || "General Maintenance",
                record.status || "completed",
                record.vendorName,
                record.notes,
                ...(record.partsUsed || []).map(part => part.name),
            ].filter(Boolean).join(" ").toLowerCase();

            const matchesSearch = term ? searchableText.includes(term) : true;
            const matchesStatus = statusFilter ? (record.status || "completed") === statusFilter : true;
            const matchesVehicle = vehicleFilter ? vehicle?._id === vehicleFilter : true;

            return matchesSearch && matchesStatus && matchesVehicle;
        });
    }, [records, searchTerm, statusFilter, vehicleFilter]);

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setVehicleFilter("");
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/maintenance/${recordToDelete._id}`);
            setRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
            toast.success("Record deleted successfully");
            setConfirmVisible(false);
        } catch (err) {
            toast.error("Failed to delete record");
        }
    };

    const handleAdd = (newRecord) => {
        setRecords(prev => [...prev, newRecord]);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-8">🛠️ Maintenance Records</h1>


            <div className="mb-6 rounded-xl border border-brand-border bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search plate, vehicle, type, vendor..."
                        className="w-full rounded border p-2"
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded border p-2">
                        <option value="">All Statuses</option>
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="w-full rounded border p-2">
                        <option value="">All Vehicles</option>
                        {vehicles.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.name || `${vehicle.brand} ${vehicle.model}`} - {vehicle.plateNumber}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-brand-slate">
                    <span>Showing {filteredRecords.length} of {records.length} maintenance records</span>
                    <button type="button" onClick={resetFilters} className="text-brand-navy hover:underline">Reset filters</button>
                </div>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-navy text-white px-4 py-2 rounded hover:bg-brand-deep"
                >
                    ➕ Add Maintenance
                </button>
            </div>

            {filteredRecords.length === 0 ? (
                <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-brand-slate shadow-sm">
                    No maintenance records match the current search or filters.
                </div>
            ) : (
            <ul className="space-y-4">
                {filteredRecords.map(record => {
                    const isOpen = expandedId === record._id;
                    const vehicle = record.vehicleId;

                    return (
                        <li key={record._id} className="bg-white border rounded shadow">
                            <button
                                onClick={() => toggleExpand(record._id)}
                                className="w-full flex justify-between items-center px-4 py-3 hover:bg-brand-soft transition"
                            >
                                <div className="font-medium text-lg">
                                    {isOpen ? "➖" : "➕"} {vehicle?.brand || "Unknown"} {vehicle?.model || ""}
                                    <span className="ml-2 text-sm font-normal text-brand-slate">{record.maintenanceType || "General Maintenance"}</span>
                                </div>
                                <span className="text-xs uppercase tracking-wide bg-brand-soft text-brand-navy px-2 py-1 rounded">{record.status || "completed"}</span>
                            </button>

                            <AnimatePresence mode="wait">
                                {isOpen && (
                                    <div
                                        key={`motion-${record._id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="px-6 pb-4 pt-2 text-sm text-brand-slate"
                                    >
                                        <p><strong>🆔 Plate:</strong> {vehicle?.plateNumber || "Unknown"}</p>
                                        <p><strong>🧰 Type:</strong> {record.maintenanceType || "General Maintenance"}</p>
                                        <p><strong>📌 Status:</strong> {record.status || "completed"}</p>
                                        <p><strong>📅 Date:</strong> {new Date(record.serviceDate).toLocaleDateString()}</p>
                                        {record.nextServiceDate && (
                                            <p><strong>⏭️ Next Service:</strong> {new Date(record.nextServiceDate).toLocaleDateString()}</p>
                                        )}
                                        {record.odometerReading !== undefined && record.odometerReading !== null && (
                                            <p><strong>🛣️ Odometer:</strong> {Number(record.odometerReading).toLocaleString()} mi</p>
                                        )}
                                        {record.vendorName && <p><strong>👨‍🔧 Vendor/Mechanic:</strong> {record.vendorName}</p>}
                                        {record.notes && <p><strong>📝 Notes:</strong> {record.notes}</p>}

                                        <p><strong>🛠️ Services:</strong></p>
                                        <ul className="list-disc pl-5 mt-1">
                                            {record.services.map((srv, idx) => (
                                                <li key={idx}>{srv.description} — €{srv.cost}</li>
                                            ))}
                                        </ul>

                                        <p><strong>🔧 Parts Used:</strong></p>
                                        <ul className="list-disc pl-5 mt-1">
                                            {record.partsUsed && record.partsUsed.length > 0 ? (
                                                record.partsUsed.map((part, i) => (
                                                    <li key={i}>{part.name || "Unknown part"}</li>
                                                ))
                                            ) : (
                                                <li>None</li>
                                            )}
                                        </ul>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => navigate(`/edit-maintenance/${record._id}`)}
                                                className="bg-brand-gold hover:bg-brand-highlight text-white px-3 py-1 rounded"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await axios.get(`/api/bills/by-maintenance/${record._id}`);
                                                        setSelectedInvoice(res.data);
                                                        setInvoiceModalVisible(true);
                                                    } catch (err) {
                                                        toast.error("No invoice found for this maintenance.");
                                                    }
                                                }}
                                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded"
                                            >
                                                📄 View Invoice
                                            </button>



                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </li>
                    );
                })}
            </ul>
            )}

            {/* Add Modal */}
            <AddMaintenanceModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                vehicles={vehicles}
                onSave={handleAdd}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                visible={confirmVisible}
                title="Delete Record"
                message="Are you sure you want to delete this maintenance record?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmVisible(false)}
            />
            {/* Invoice Modal */}
            <InvoiceModal
                visible={invoiceModalVisible}
                invoice={selectedInvoice}
                onClose={() => setInvoiceModalVisible(false)}
            />

        </div>
    );
}
