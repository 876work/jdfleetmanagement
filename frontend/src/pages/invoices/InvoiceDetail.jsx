import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import InvoiceDocument from "../../components/InvoiceDocument";

export default function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const response = await axiosInstance.get(`/api/bills/${id}`);
                setBill(response.data);
            } catch (error) {
                toast.error(`Failed to load invoice: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchBill();
    }, [id]);

    return (
        <div className="app-shell invoice-page-shell">
            <main className="app-container invoice-detail-container">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
                    <button type="button" className="btn-secondary" onClick={() => navigate("/invoices")}>
                        ← Back to Invoices
                    </button>

                    {bill && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button type="button" className="btn-warning" onClick={() => navigate(`/edit-bill/${bill._id}`)}>
                                Edit Invoice
                            </button>
                            <button type="button" className="btn-primary" onClick={() => window.print()}>
                                Print Invoice
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="card-pad text-brand-slate">Loading invoice...</div>
                ) : bill ? (
                    <InvoiceDocument bill={bill} />
                ) : (
                    <div className="empty-state">Invoice not found.</div>
                )}
            </main>
        </div>
    );
}
