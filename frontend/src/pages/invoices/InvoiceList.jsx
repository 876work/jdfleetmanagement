import React, { useEffect, useMemo, useState, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} €`;

const formatStatus = (status = 'unpaid') => status.charAt(0).toUpperCase() + status.slice(1);

const statusClass = (status = 'unpaid') => ({
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-200 text-gray-700',
    unpaid: 'bg-yellow-100 text-yellow-800',
}[status] || 'bg-yellow-100 text-yellow-800');

const InvoiceList = () => {
    const [bills, setBills] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [printBill, setPrintBill] = useState(null);
    const printRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, custRes, vehRes] = await Promise.all([
                    axiosInstance.get('/api/bills'),
                    axiosInstance.get('/api/customers'),
                    axiosInstance.get('/api/vehicles'),
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

    const statusOptions = useMemo(() => (
        [...new Set(bills.map((bill) => (bill.paymentStatus || 'unpaid').trim()).filter(Boolean))].sort()
    ), [bills]);

    const filteredBills = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return bills.filter((bill) => {
            const customerName = [bill.customer?.firstName, bill.customer?.lastName].filter(Boolean).join(' ');
            const vehicleName = [bill.vehicle?.name, bill.vehicle?.brand, bill.vehicle?.model, bill.vehicle?.plateNumber].filter(Boolean).join(' ');
            const searchableText = [
                customerName,
                vehicleName,
                bill.paymentStatus || 'unpaid',
                bill.notes,
                ...(bill.services || []).map((srv) => srv.description),
                ...(bill.maintenanceId?.partsUsed || []).map((part) => part.name),
            ].filter(Boolean).join(' ').toLowerCase();

            const matchCustomer = selectedCustomer ? bill.customer?._id === selectedCustomer : true;
            const matchVehicle = selectedVehicle ? bill.vehicle?._id === selectedVehicle : true;
            const matchStatus = selectedStatus ? (bill.paymentStatus || 'unpaid') === selectedStatus : true;
            const matchSearch = term ? searchableText.includes(term) : true;

            return matchCustomer && matchVehicle && matchStatus && matchSearch;
        });
    }, [bills, searchTerm, selectedCustomer, selectedStatus, selectedVehicle]);

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCustomer('');
        setSelectedVehicle('');
        setSelectedStatus('');
    };

    const handleArchive = async (id) => {
        const confirmed = window.confirm('Are you sure you want to archive this invoice?');
        if (!confirmed) return;

        try {
            await axiosInstance.patch(`/api/bills/${id}/archive`);
            toast.success('Invoice archived successfully');
            setBills((prev) => prev.filter((b) => b._id !== id));
        } catch (err) {
            toast.error(`Failed to archive invoice: ${err.message}`);
        }
    };

    const handlePrint = (bill) => {
        setPrintBill(bill);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-10"> 🧾 Fleet Invoices</h1>

            <div className="mb-6 rounded-xl border border-brand-border bg-white p-4 shadow-sm">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search customer, vehicle, plate, service, status, or parts..."
                    className="mb-3 w-full rounded border p-2"
                />
                <div className="grid gap-3 md:grid-cols-3">
                    <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="border p-2 rounded w-full">
                        <option value="">All Customers</option>
                        {customers.map((cust) => (
                            <option key={cust._id} value={cust._id}>{cust.firstName} {cust.lastName}</option>
                        ))}
                    </select>

                    <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="border p-2 rounded w-full">
                        <option value="">All Vehicles</option>
                        {vehicles.map((veh) => (
                            <option key={veh._id} value={veh._id}>{veh.name || veh.model} - {veh.plateNumber}</option>
                        ))}
                    </select>

                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border p-2 rounded w-full">
                        <option value="">All Invoice Statuses</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>{formatStatus(status)}</option>
                        ))}
                    </select>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-brand-slate">
                    <span>Showing {filteredBills.length} of {bills.length} invoices</span>
                    <button type="button" onClick={resetFilters} className="text-brand-navy hover:underline">Reset filters</button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <button className="bg-brand-navy text-white px-4 py-2 rounded hover:bg-brand-navy" onClick={resetFilters}>Reset Filters</button>
                <button className="bg-brand-success text-white px-4 py-2 rounded hover:bg-brand-success" onClick={() => navigate('/add-bill')}> ➕ Add Invoice</button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : filteredBills.length === 0 ? (
                <p>No invoices found.</p>
            ) : (
                <div className="space-y-4">
                    {filteredBills.map((bill) => (
                        <div key={bill._id} className="border p-4 rounded shadow-sm bg-white hover:shadow-md transition flex justify-between items-center">
                            <div>
                                <div className="font-semibold"> 🦾 Customer: {bill.customer ? `${bill.customer.firstName} ${bill.customer.lastName}` : 'Unknown'}</div>
                                <div>🚗 Vehicle: {bill.vehicle?.model || 'N/A'} - {bill.vehicle?.plateNumber || ''}</div>
                                <div>💰 Amount: {formatCurrency(bill.totalPrice)}</div>
                                <div>📅 Invoice Date: {new Date(bill.date).toLocaleDateString()}</div>
                                <div className="mt-1">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(bill.paymentStatus)}`}>
                                        {formatStatus(bill.paymentStatus)}
                                    </span>
                                </div>
                                {bill.notes && <div className="mt-2 text-sm text-brand-slate">📝 Notes: {bill.notes}</div>}

                                <details className="mt-2">
                                    <summary className="cursor-pointer text-brand-navy">View Services</summary>
                                    <ul className="list-disc pl-5 mt-2">
                                        {bill.services?.map((srv, idx) => (
                                            <li key={idx}>{srv.description} — {formatCurrency(srv.price)}</li>
                                        ))}
                                    </ul>
                                </details>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-brand-navy">Parts Used</summary>
                                    <ul className="list-disc pl-5 mt-2">
                                        {bill.maintenanceId?.partsUsed?.length > 0 ? (
                                            bill.maintenanceId.partsUsed.map((part, idx) => (
                                                <li key={idx}>{part.name}</li>
                                            ))
                                        ) : (
                                            <li className="text-brand-slate">No parts used</li>
                                        )}
                                    </ul>
                                </details>
                            </div>


                            <div className="flex flex-col items-end gap-2">
                                <button onClick={() => navigate(`/edit-bill/${bill._id}`)} className="bg-brand-gold text-white px-5 py-2 rounded hover:bg-brand-highlight"> ✏️ Edit</button>
                                <button onClick={() => handleArchive(bill._id)} className="bg-brand-error text-white px-3 py-2 rounded hover:bg-brand-error"> 📦 Archive</button>
                                <button onClick={() => handlePrint(bill)} className="bg-indigo-500 text-white px-5 py-2 rounded hover:bg-indigo-600"> 🖶️ Print</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Printable View */}
            {printBill && (
                <div className="fixed inset-0 bg-white text-gray-900 p-10 z-50 overflow-auto" ref={printRef}>
                    <div className="max-w-xl mx-auto border rounded shadow p-6">
                        <h2 className="text-xl font-bold text-center mb-4">🧾 Invoice Details</h2>
                        <p><strong>🧍 Customer:</strong> {printBill.customer?.firstName} {printBill.customer?.lastName}</p>
                        <p><strong>🚗 Vehicle:</strong> {printBill.vehicle?.brand} {printBill.vehicle?.model} ({printBill.vehicle?.plateNumber})</p>
                        <p><strong>📅 Invoice Date:</strong> {new Date(printBill.date).toLocaleDateString()}</p>
                        <p><strong>💳 Payment Status:</strong> {formatStatus(printBill.paymentStatus)}</p>

                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Services:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {printBill.services?.map((srv, idx) => (
                                    <li key={idx}>{srv.description} — {formatCurrency(srv.price)}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Parts Used:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {Array.isArray(printBill.maintenanceId?.partsUsed) && printBill.maintenanceId.partsUsed.length > 0 ? (
                                    printBill.maintenanceId.partsUsed.map((part, idx) => (
                                        <li key={idx}>{part.name}</li>
                                    ))
                                ) : (
                                    <li className="text-gray-400">None</li>
                                )}
                            </ul>
                        </div>

                        {printBill.notes && <p className="mt-4"><strong>Notes:</strong> {printBill.notes}</p>}
                        <p className="mt-4 font-bold text-right text-lg">💰 Amount Due: {formatCurrency(printBill.totalPrice)}</p>

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3 mt-6 no-print">
                            <button
                                type="button"
                                onClick={() => setPrintBill(null)}
                                className="bg-gray-300 text-brand-text px-5 py-2 rounded hover:bg-gray-400"
                            >
                                ❌ Cancel
                            </button>

                            <button
                                onClick={() => {
                                    window.print();
                                    setTimeout(() => setPrintBill(null), 500);
                                }}
                                className="bg-brand-navy hover:bg-brand-deep text-white px-6 py-2 rounded"
                            >
                                🖨️ Print Now
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default InvoiceList;
