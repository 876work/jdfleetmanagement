import { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";
import { formatXcd } from "../../components/InvoiceDocument";

export default function ArchivedInvoices() {
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        const fetchArchived = async () => {
            try {
                const res = await axios.get("/api/bills/archived");
                setInvoices(res.data);
            } catch (err) {
                console.error("Failed to fetch archived invoices:", err);
            }
        };
        fetchArchived();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-center mb-6">🗃️ Archived Reports</h1>

            {invoices.length === 0 ? (
                <p className="text-center text-brand-slate">No reports available at this time.</p>
            ) : (
                <table className="min-w-full text-sm border rounded shadow">
                    <thead className="bg-brand-soft">
                        <tr>
                            <th className="text-left px-4 py-2">Customer</th>
                            <th className="text-left px-4 py-2">Vehicle</th>
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-left px-4 py-2">Total (XCD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv._id} className="border-b hover:bg-brand-soft">
                                <td className="p-3">{inv.customer?.firstName} {inv.customer?.lastName}</td>
                                <td className="p-3">{inv.vehicle?.brand} {inv.vehicle?.model}</td>
                                <td className="p-3">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="p-3">{formatXcd(inv.totalPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
