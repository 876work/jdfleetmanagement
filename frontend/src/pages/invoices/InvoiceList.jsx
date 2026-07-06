import React, { useEffect, useState, useRef } from 'react';
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

    const filteredBills = bills.filter((bill) => {
        const matchCustomer = selectedCustomer ? bill.customer?._id === selectedCustomer : true;
        const matchVehicle = selectedVehicle ? bill.vehicle?._id === selectedVehicle : true;
        return matchCustomer && matchVehicle;
    });

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
        <div className="app-shell"><main className="app-container"><section className="page-header"><p className="eyebrow">Billing reports</p><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="page-title">Fleet Invoices</h1><p className="page-description">Filter, review, print, and archive JD Fleet Management invoices.</p></div><button className="btn-success" onClick={() => navigate('/add-bill')}>Add Invoice</button></div></section>

            <div className="card-pad mb-6 grid gap-4 sm:grid-cols-2">
                <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="form-control">
                    <option value="">All Customers</option>
                    {customers.map((cust) => (
                        <option key={cust._id} value={cust._id}>{cust.firstName} {cust.lastName}</option>
                    ))}
                </select>

                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="form-control">
                    <option value="">All Vehicles</option>
                    {vehicles.map((veh) => (
                        <option key={veh._id} value={veh._id}>{veh.model} - {veh.plateNumber}</option>
                    ))}
                </select>
            </div>

            <div className="mb-6 flex justify-end"><button className="btn-secondary" onClick={() => { setSelectedCustomer(''); setSelectedVehicle(''); }}>Reset Filters</button></div>

            {loading ? (
                <div className="card-pad text-brand-slate">Loading invoices...</div>
            ) : filteredBills.length === 0 ? (
                <div className="empty-state"><div className="text-3xl">🧾</div><h2 className="mt-3 text-lg font-bold text-brand-deep">No invoices found</h2><p className="mt-1">Try adjusting filters or create a new invoice.</p><button className="btn-primary mt-5" onClick={() => navigate('/add-bill')}>Create Invoice</button></div>
            ) : (
                <div className="grid gap-4">
                    {filteredBills.map((bill) => (
                        <div key={bill._id} className="card-pad flex flex-col gap-4 transition hover:shadow-md lg:flex-row lg:items-start lg:justify-between">
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


                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                                <button onClick={() => navigate(`/edit-bill/${bill._id}`)} className="btn-warning"> ✏️ Edit</button>
                                <button onClick={() => handleArchive(bill._id)} className="btn-danger"> 📦 Archive</button>
                                <button onClick={() => handlePrint(bill)} className="btn-secondary"> 🖶️ Print</button>
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

        </main></div>
    );
};

export default InvoiceList;
