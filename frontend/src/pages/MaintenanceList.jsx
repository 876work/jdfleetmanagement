import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axiosInstance";
import { motion as Motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "../components/ConfirmModal";
import AddMaintenanceModal from "../components/AddMaintenanceModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import InvoiceModal from "../components/InvoiceModal";
import { useAuth } from "../context/useAuth";
import { isAdminUser, canStaffEditMaintenance } from "../utils/permissions";

export default function MaintenanceList() {
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const navigate = useNavigate();
    const { auth } = useAuth();
    const isAdmin = isAdminUser(auth);
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [vehicleFilter, setVehicleFilter] = useState("");

    const fetchRecords = async () => {
        try {
            const res = await axios.get("/api/maintenance");
            setRecords(res.data);
        } catch {
            toast.error("Failed to fetch maintenance records");
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await axios.get("/api/vehicles");
            setVehicles(res.data);
        } catch {
            toast.error("Failed to fetch vehicles");
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchVehicles();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const statusOptions = useMemo(() => {
        return [
            ...new Set(
                records
                    .map((record) => (record.status || "completed").trim())
                    .filter(Boolean)
            ),
        ].sort();
    }, [records]);

    const filteredRecords = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return records.filter((record) => {
            const vehicle = record.vehicleId;
            const recordStatus = (record.status || "completed").trim();

            const searchableText = [
                vehicle?.name,
                vehicle?.brand,
                vehicle?.model,
                vehicle?.plateNumber,
                record.maintenanceType || "General Maintenance",
                recordStatus,
                record.vendorName,
                record.notes,
                ...(record.partsUsed || []).map((part) => part.name),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = term ? searchableText.includes(term) : true;
            const matchesStatus = statusFilter ? recordStatus === statusFilter : true;
            const matchesVehicle = vehicleFilter ? vehicle?._id === vehicleFilter : true;

            return matchesSearch && matchesStatus && matchesVehicle;
        });
    }, [records, searchTerm, statusFilter, vehicleFilter]);

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setVehicleFilter("");
    };

    const openDeleteConfirm = (record) => {
        setRecordToDelete(record);
        setConfirmVisible(true);
    };

    const handleDelete = async () => {
        if (!recordToDelete?._id) {
            toast.error("No maintenance record selected");
            return;
        }

        try {
            await axios.delete(`/api/maintenance/${recordToDelete._id}`);
            setRecords((prev) => prev.filter((record) => record._id !== recordToDelete._id));
            toast.success("Record deleted successfully");
            setConfirmVisible(false);
            setRecordToDelete(null);
        } catch {
            toast.error("Failed to delete record");
        }
    };

    const handleAdd = (newRecord) => {
        setRecords((prev) => [...prev, newRecord]);
    };

    return (
        <div className="app-shell">
            <main className="app-container">
                <section className="page-header">
                    <p className="eyebrow">Service operations</p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="page-title">Maintenance Records</h1>
                            <p className="page-description">
                                Track service history, parts usage, invoice links, and upcoming maintenance needs.
                            </p>
                        </div>

                        <button onClick={() => setShowModal(true)} className="btn-primary">
                            Add Maintenance
                        </button>
                    </div>
                </section>

                {records.length > 0 && (
                    <section className="mb-6 rounded-xl border border-brand-border bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search plate, vehicle, type, vendor..."
                                className="w-full rounded border border-brand-border p-2"
                            />

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full rounded border border-brand-border p-2"
                            >
                                <option value="">All Statuses</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={vehicleFilter}
                                onChange={(event) => setVehicleFilter(event.target.value)}
                                className="w-full rounded border border-brand-border p-2"
                            >
                                <option value="">All Vehicles</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle._id} value={vehicle._id}>
                                        {vehicle.name || `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()}{" "}
                                        {vehicle.plateNumber ? `- ${vehicle.plateNumber}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm text-brand-slate">
                            <span>
                                Showing {filteredRecords.length} of {records.length} maintenance records
                            </span>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-brand-navy hover:underline"
                            >
                                Reset filters
                            </button>
                        </div>
                    </section>
                )}

                {records.length === 0 ? (
                    <div className="empty-state">
                        <div className="text-3xl">🛠️</div>
                        <h2 className="mt-3 text-lg font-bold text-brand-deep">
                            No maintenance records
                        </h2>
                        <p className="mt-1">
                            Create a maintenance record to build service history for your fleet.
                        </p>
                        <button onClick={() => setShowModal(true)} className="btn-primary mt-5">
                            Add Maintenance
                        </button>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="empty-state">
                        <div className="text-3xl">🔎</div>
                        <h2 className="mt-3 text-lg font-bold text-brand-deep">
                            No matching maintenance records
                        </h2>
                        <p className="mt-1">
                            Adjust your search or filters to find the record you need.
                        </p>
                        <button type="button" onClick={resetFilters} className="btn-primary mt-5">
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <ul className="grid gap-4">
                        {filteredRecords.map((record) => {
                            const isOpen = expandedId === record._id;
                            const vehicle = record.vehicleId;
                            const recordStatus = (record.status || "completed").trim();

                            return (
                                <li key={record._id} className="card overflow-hidden">
                                    <button
                                        onClick={() => toggleExpand(record._id)}
                                        className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-brand-soft sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="text-lg font-bold text-brand-deep">
                                            {isOpen ? "➖" : "➕"} {vehicle?.brand || "Unknown"}{" "}
                                            {vehicle?.model || ""}
                                            <span className="ml-2 text-sm font-normal text-brand-slate">
                                                {record.maintenanceType || "General Maintenance"}
                                            </span>
                                        </div>

                                        <span className="rounded bg-brand-soft px-2 py-1 text-xs uppercase tracking-wide text-brand-navy">
                                            {recordStatus}
                                        </span>
                                    </button>

                                    <AnimatePresence mode="wait">
                                        {isOpen && (
                                            <Motion.div
                                                key={`motion-${record._id}`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="border-t border-brand-border px-4 py-4 text-sm text-brand-slate sm:px-6"
                                            >
                                                <p>
                                                    <strong>🆔 Plate:</strong>{" "}
                                                    {vehicle?.plateNumber || "Unknown"}
                                                </p>

                                                <p>
                                                    <strong>🧰 Type:</strong>{" "}
                                                    {record.maintenanceType || "General Maintenance"}
                                                </p>

                                                <p>
                                                    <strong>📌 Status:</strong> {recordStatus}
                                                </p>

                                                <p>
                                                    <strong>📅 Date:</strong>{" "}
                                                    {record.serviceDate
                                                        ? new Date(record.serviceDate).toLocaleDateString()
                                                        : "Not set"}
                                                </p>

                                                {record.nextServiceDate && (
                                                    <p>
                                                        <strong>⏭️ Next Service:</strong>{" "}
                                                        {new Date(record.nextServiceDate).toLocaleDateString()}
                                                    </p>
                                                )}

                                                {record.odometerReading !== undefined &&
                                                    record.odometerReading !== null && (
                                                        <p>
                                                            <strong>🛣️ Odometer:</strong>{" "}
                                                            {Number(record.odometerReading).toLocaleString()} mi
                                                        </p>
                                                    )}

                                                {record.vendorName && (
                                                    <p>
                                                        <strong>👨‍🔧 Vendor/Mechanic:</strong>{" "}
                                                        {record.vendorName}
                                                    </p>
                                                )}

                                                {record.notes && (
                                                    <p>
                                                        <strong>📝 Notes:</strong> {record.notes}
                                                    </p>
                                                )}

                                                <p className="mt-3">
                                                    <strong>🛠️ Services:</strong>
                                                </p>

                                                <ul className="mt-1 list-disc pl-5">
                                                    {record.services && record.services.length > 0 ? (
                                                        record.services.map((service, index) => (
                                                            <li key={index}>
                                                                {service.description || "Service"} — €
                                                                {service.cost || 0}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>No services listed</li>
                                                    )}
                                                </ul>

                                                <p className="mt-3">
                                                    <strong>🔧 Parts Used:</strong>
                                                </p>

                                                <ul className="mt-1 list-disc pl-5">
                                                    {record.partsUsed && record.partsUsed.length > 0 ? (
                                                        record.partsUsed.map((part, index) => (
                                                            <li key={index}>
                                                                {part.name || "Unknown part"}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>None</li>
                                                    )}
                                                </ul>

                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    {(isAdmin || canStaffEditMaintenance(record)) && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(`/edit-maintenance/${record._id}`)
                                                            }
                                                            className="btn-warning"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await axios.get(
                                                                    `/api/bills/by-maintenance/${record._id}`
                                                                );
                                                                setSelectedInvoice(res.data);
                                                                setInvoiceModalVisible(true);
                                                            } catch {
                                                                toast.error(
                                                                    "No invoice found for this maintenance."
                                                                );
                                                            }
                                                        }}
                                                        className="btn-secondary"
                                                    >
                                                        📄 View Invoice
                                                    </button>

                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => openDeleteConfirm(record)}
                                                            className="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </Motion.div>
                                        )}
                                    </AnimatePresence>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <AddMaintenanceModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    vehicles={vehicles}
                    onSave={handleAdd}
                />

                <ConfirmModal
                    visible={confirmVisible}
                    title="Delete Record"
                    message="Are you sure you want to delete this maintenance record?"
                    onConfirm={handleDelete}
                    onCancel={() => {
                        setConfirmVisible(false);
                        setRecordToDelete(null);
                    }}
                />

                <InvoiceModal
                    visible={invoiceModalVisible}
                    invoice={selectedInvoice}
                    onClose={() => {
                        setInvoiceModalVisible(false);
                        setSelectedInvoice(null);
                    }}
                />
            </main>
        </div>
    );
}