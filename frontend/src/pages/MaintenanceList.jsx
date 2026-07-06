import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { motion as Motion } from "framer-motion";
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
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/maintenance/${recordToDelete._id}`);
            setRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
            toast.success("Record deleted successfully");
            setConfirmVisible(false);
        } catch {
            toast.error("Failed to delete record");
        }
    };

    const handleAdd = (newRecord) => {
        setRecords(prev => [...prev, newRecord]);
    };

    return (
        <div className="app-shell"><main className="app-container"><section className="page-header"><p className="eyebrow">Service operations</p><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="page-title">Maintenance Records</h1><p className="page-description">Track service history, parts usage, invoice links, and upcoming maintenance needs.</p></div><button onClick={() => setShowModal(true)} className="btn-primary">Add Maintenance</button></div></section>

            {records.length === 0 ? <div className="empty-state"><div className="text-3xl">🛠️</div><h2 className="mt-3 text-lg font-bold text-brand-deep">No maintenance records</h2><p className="mt-1">Create a maintenance record to build service history for your fleet.</p><button onClick={() => setShowModal(true)} className="btn-primary mt-5">Add Maintenance</button></div> : <ul className="grid gap-4">
                {records.map(record => {
                    const isOpen = expandedId === record._id;
                    const vehicle = record.vehicleId;

                    return (
                        <li key={record._id} className="card overflow-hidden">
                            <button
                                onClick={() => toggleExpand(record._id)}
                                className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-brand-soft sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="text-lg font-bold text-brand-deep">
                                    {isOpen ? "➖" : "➕"} {vehicle?.brand || "Unknown"} {vehicle?.model || ""}
                                    <span className="ml-2 text-sm font-normal text-brand-slate">{record.maintenanceType || "General Maintenance"}</span>
                                </div>
                                <span className="text-xs uppercase tracking-wide bg-brand-soft text-brand-navy px-2 py-1 rounded">{record.status || "completed"}</span>
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
                                                className="btn-warning"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await axios.get(`/api/bills/by-maintenance/${record._id}`);
                                                        setSelectedInvoice(res.data);
                                                        setInvoiceModalVisible(true);
                                                    } catch {
                                                        toast.error("No invoice found for this maintenance.");
                                                    }
                                                }}
                                                className="btn-secondary"
                                            >
                                                📄 View Invoice
                                            </button>



                                        </div>
                                    </Motion.div>
                                )}
                            </AnimatePresence>
                        </li>
                    );
                })}
            </ul>}

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

        </main></div>
    );
}
