import React from "react";

import { formatCurrency } from "../utils/currency";

export default function InvoiceModal({ visible, onClose, invoice }) {
    if (!visible || !invoice) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-[500px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-center mb-4">🧾 Invoice Details</h2>

                <p><strong>🧍 Customer:</strong>
                    {invoice.customer
                        ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                        : "—"}
                </p>
                <p><strong>🚗 Vehicle:</strong> {invoice.vehicle?.brand} {invoice.vehicle?.model} ({invoice.vehicle?.plateNumber})</p>
                <p><strong>📅 Invoice Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                <p><strong>💳 Status:</strong> {(invoice.paymentStatus || "unpaid").charAt(0).toUpperCase() + (invoice.paymentStatus || "unpaid").slice(1)}</p>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Services:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {invoice.services?.map((srv, idx) => (
                            <li key={idx}>{srv.description} — {formatCurrency(srv.price)}</li>
                        ))}
                    </ul>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Parts Used:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {Array.isArray(invoice.maintenanceId?.partsUsed) &&
                            invoice.maintenanceId.partsUsed.length > 0 ? (
                            invoice.maintenanceId.partsUsed.map((part, idx) => (
                                <li key={idx}>{part.name}</li>
                            ))
                        ) : (
                            <li className="text-gray-400">None</li>
                        )}

                    </ul>
                </div>
                {invoice.notes && <p className="mt-4"><strong>Notes:</strong> {invoice.notes}</p>}
                <p className="mt-4 font-bold text-right text-lg">💰 Amount: {formatCurrency(invoice.totalPrice)}</p>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
