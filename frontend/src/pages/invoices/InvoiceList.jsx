import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { formatCurrency } from "../../utils/currency";

const formatStatus = (status = "unpaid") =>
    status.charAt(0).toUpperCase() + status.slice(1);

const statusClass = (status = "unpaid") =>
    ({
        paid: "bg-green-100 text-green-800",
        overdue: "bg-red-100 text-red-800",
        cancelled: "bg-gray-200 text-gray-700",
        unpaid: "bg-yellow-100 text-yellow-800",
    }[status] || "bg-yellow-100 text-yellow-800");

const InvoiceList = () => {
    const [bills, setBills] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [printBill, setPrintBill] = useState(null);

    const printRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, custRes, vehRes] = await Promise.all([
                    axiosInstance.get("/api/bills"),
                    axiosInstance.get("/api/customers"),
                    axiosInstance.get("/api/vehicles"),
                ]);

                setBills(billRes.data);
                setCustomers(custRes.data);
                setVehicles(vehRes.data);
            } catch (error) {
                toast.error(`Failed to load invoices: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const statusOptions = useMemo(() => {
        return [
            ...new Set(
                bills
                    .map((bill) => (bill.paymentStatus || "unpaid").trim())
                    .filter(Boolean)
            ),
        ].sort();
    }, [bills]);

    const filteredBills = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return bills.filter((bill) => {
            const customerName = [
                bill.customer?.firstName,
                bill.customer?.lastName,
            ]
                .filter(Boolean)
                .join(" ");

            const vehicleName = [
                bill.vehicle?.name,
                bill.vehicle?.brand,
                bill.vehicle?.model,
                bill.vehicle?.plateNumber,
            ]
                .filter(Boolean)
                .join(" ");

            const billStatus = (bill.paymentStatus || "unpaid").trim();

            const searchableText = [
                customerName,
                vehicleName,
                billStatus,
                bill.notes,
                ...(bill.services || []).map((service) => service.description),
                ...(bill.maintenanceId?.partsUsed || []).map((part) => part.name),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchCustomer = selectedCustomer
                ? bill.customer?._id === selectedCustomer
                : true;

            const matchVehicle = selectedVehicle
                ? bill.vehicle?._id === selectedVehicle
                : true;

            const matchStatus = selectedStatus
                ? billStatus === selectedStatus
                : true;

            const matchSearch = term ? searchableText.includes(term) : true;

            return matchCustomer && matchVehicle && matchStatus && matchSearch;
        });
    }, [bills, searchTerm, selectedCustomer, selectedStatus, selectedVehicle]);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCustomer("");
        setSelectedVehicle("");
        setSelectedStatus("");
    };

    const handleArchive = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to archive this invoice?"
        );

        if (!confirmed) return;

        try {
            await axiosInstance.patch(`/api/bills/${id}/archive`);
            toast.success("Invoice archived successfully");
            setBills((prev) => prev.filter((bill) => bill._id !== id));
        } catch (err) {
            toast.error(`Failed to archive invoice: ${err.message}`);
        }
    };

    const handlePrint = (bill) => {
        setPrintBill(bill);
    };

    return (
        <div className="app-shell">
            <main className="app-container">
                <section className="page-header">
                    <p className="eyebrow">Billing reports</p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="page-title">Fleet Invoices</h1>

                            <p className="page-description">
                                Filter, review, print, and archive JD Fleet Management
                                invoices.
                            </p>
                        </div>

                        <button
                            className="btn-success"
                            onClick={() => navigate("/add-bill")}
                        >
                            Add Invoice
                        </button>
                    </div>
                </section>

                <section className="mb-6 rounded-xl border border-brand-border bg-white p-4 shadow-sm">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search customer, vehicle, plate, service, status, or parts..."
                        className="mb-3 w-full rounded border border-brand-border p-2"
                    />

                    <div className="grid gap-3 md:grid-cols-3">
                        <select
                            value={selectedCustomer}
                            onChange={(event) => setSelectedCustomer(event.target.value)}
                            className="form-control"
                        >
                            <option value="">All Customers</option>

                            {customers.map((customer) => (
                                <option key={customer._id} value={customer._id}>
                                    {customer.firstName} {customer.lastName}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedVehicle}
                            onChange={(event) => setSelectedVehicle(event.target.value)}
                            className="form-control"
                        >
                            <option value="">All Vehicles</option>

                            {vehicles.map((vehicle) => (
                                <option key={vehicle._id} value={vehicle._id}>
                                    {vehicle.name ||
                                        `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() ||
                                        "Unnamed vehicle"}{" "}
                                    {vehicle.plateNumber ? `- ${vehicle.plateNumber}` : ""}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(event) => setSelectedStatus(event.target.value)}
                            className="form-control"
                        >
                            <option value="">All Invoice Statuses</option>

                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {formatStatus(status)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-brand-slate">
                        <span>
                            Showing {filteredBills.length} of {bills.length} invoices
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

                {loading ? (
                    <div className="card-pad text-brand-slate">Loading invoices...</div>
                ) : filteredBills.length === 0 ? (
                    <div className="empty-state">
                        <div className="text-3xl">🧾</div>

                        <h2 className="mt-3 text-lg font-bold text-brand-deep">
                            No invoices found
                        </h2>

                        <p className="mt-1">
                            Try adjusting filters or create a new invoice.
                        </p>

                        <button
                            className="btn-primary mt-5"
                            onClick={() => navigate("/add-bill")}
                        >
                            Create Invoice
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredBills.map((bill) => (
                            <div
                                key={bill._id}
                                className="card-pad flex flex-col gap-4 transition hover:shadow-md lg:flex-row lg:items-start lg:justify-between"
                            >
                                <div>
                                    <div className="font-semibold">
                                        🦾 Customer:{" "}
                                        {bill.customer
                                            ? `${bill.customer.firstName} ${bill.customer.lastName}`
                                            : "Unknown"}
                                    </div>

                                    <div>
                                        🚗 Vehicle: {bill.vehicle?.model || "N/A"}{" "}
                                        {bill.vehicle?.plateNumber
                                            ? `- ${bill.vehicle.plateNumber}`
                                            : ""}
                                    </div>

                                    <div>💰 Amount: {formatCurrency(bill.totalPrice)}</div>

                                    <div>
                                        📅 Invoice Date:{" "}
                                        {bill.date
                                            ? new Date(bill.date).toLocaleDateString()
                                            : "N/A"}
                                    </div>

                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(
                                                bill.paymentStatus
                                            )}`}
                                        >
                                            {formatStatus(bill.paymentStatus)}
                                        </span>
                                    </div>

                                    {bill.notes && (
                                        <div className="mt-2 text-sm text-brand-slate">
                                            📝 Notes: {bill.notes}
                                        </div>
                                    )}

                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-brand-navy">
                                            View Services
                                        </summary>

                                        <ul className="mt-2 list-disc pl-5">
                                            {bill.services?.length > 0 ? (
                                                bill.services.map((service, index) => (
                                                    <li key={index}>
                                                        {service.description} —{" "}
                                                        {formatCurrency(service.price)}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-brand-slate">
                                                    No services listed
                                                </li>
                                            )}
                                        </ul>
                                    </details>

                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-brand-navy">
                                            Parts Used
                                        </summary>

                                        <ul className="mt-2 list-disc pl-5">
                                            {bill.maintenanceId?.partsUsed?.length > 0 ? (
                                                bill.maintenanceId.partsUsed.map((part, index) => (
                                                    <li key={index}>{part.name}</li>
                                                ))
                                            ) : (
                                                <li className="text-brand-slate">
                                                    No parts used
                                                </li>
                                            )}
                                        </ul>
                                    </details>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                                    <button
                                        onClick={() => navigate(`/edit-bill/${bill._id}`)}
                                        className="btn-warning"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        onClick={() => handleArchive(bill._id)}
                                        className="btn-danger"
                                    >
                                        📦 Archive
                                    </button>

                                    <button
                                        onClick={() => handlePrint(bill)}
                                        className="btn-secondary"
                                    >
                                        🖶️ Print
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {printBill && (
                    <div
                        className="fixed inset-0 z-50 overflow-auto bg-white p-10 text-gray-900"
                        ref={printRef}
                    >
                        <div className="mx-auto max-w-xl rounded border p-6 shadow">
                            <h2 className="mb-4 text-center text-xl font-bold">
                                🧾 Invoice Details
                            </h2>

                            <p>
                                <strong>🧍 Customer:</strong>{" "}
                                {printBill.customer?.firstName}{" "}
                                {printBill.customer?.lastName}
                            </p>

                            <p>
                                <strong>🚗 Vehicle:</strong>{" "}
                                {printBill.vehicle?.brand} {printBill.vehicle?.model}{" "}
                                {printBill.vehicle?.plateNumber
                                    ? `(${printBill.vehicle.plateNumber})`
                                    : ""}
                            </p>

                            <p>
                                <strong>📅 Invoice Date:</strong>{" "}
                                {printBill.date
                                    ? new Date(printBill.date).toLocaleDateString()
                                    : "N/A"}
                            </p>

                            <p>
                                <strong>💳 Payment Status:</strong>{" "}
                                {formatStatus(printBill.paymentStatus)}
                            </p>

                            <div className="mt-4">
                                <h4 className="mb-2 font-semibold">Services:</h4>

                                <ul className="list-disc space-y-1 pl-5 text-sm">
                                    {printBill.services?.length > 0 ? (
                                        printBill.services.map((service, index) => (
                                            <li key={index}>
                                                {service.description} —{" "}
                                                {formatCurrency(service.price)}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-400">None</li>
                                    )}
                                </ul>
                            </div>

                            <div className="mt-4">
                                <h4 className="mb-2 font-semibold">Parts Used:</h4>

                                <ul className="list-disc space-y-1 pl-5 text-sm">
                                    {Array.isArray(printBill.maintenanceId?.partsUsed) &&
                                    printBill.maintenanceId.partsUsed.length > 0 ? (
                                        printBill.maintenanceId.partsUsed.map((part, index) => (
                                            <li key={index}>{part.name}</li>
                                        ))
                                    ) : (
                                        <li className="text-gray-400">None</li>
                                    )}
                                </ul>
                            </div>

                            {printBill.notes && (
                                <p className="mt-4">
                                    <strong>Notes:</strong> {printBill.notes}
                                </p>
                            )}

                            <p className="mt-4 text-right text-lg font-bold">
                                💰 Amount Due: {formatCurrency(printBill.totalPrice)}
                            </p>

                            <div className="no-print mt-6 flex justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPrintBill(null)}
                                    className="rounded bg-gray-300 px-5 py-2 text-brand-text hover:bg-gray-400"
                                >
                                    ❌ Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        window.print();
                                        setTimeout(() => setPrintBill(null), 500);
                                    }}
                                    className="rounded bg-brand-navy px-6 py-2 text-white hover:bg-brand-deep"
                                >
                                    🖨️ Print Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InvoiceList;