// src/components/InvoiceCard.jsx
import React from "react";
import { formatXcd, formatInvoiceStatus, invoiceStatusClass } from "./InvoiceDocument";

// Note: Buttons are given the "no-print" class so they are only visible on the screen, not in print.
export default function InvoiceCard({
    bill,
    onEdit,
    onArchive,
    onPrint,
    className = "",
}) {
    if (!bill) return null;

    return (
        <div className={`invoice-card bg-white border rounded shadow-sm p-4 ${className}`}>
            <div className="flex justify-between gap-4">
                <div className="flex-1">
                    <div className="font-semibold">
                        🧍 Customer:{" "}
                        {bill.customer ? `${bill.customer.firstName} ${bill.customer.lastName}` : "Unknown"}
                    </div>
                    <div>
                        🚗 Vehicle: {bill.vehicle?.brand || "—"} {bill.vehicle?.model || "—"}{" "}
                        {bill.vehicle?.plateNumber ? `(${bill.vehicle.plateNumber})` : ""}
                    </div>
                    <div>📅 Invoice Date: {new Date(bill.date).toLocaleDateString()}</div>
                    <div>💳 Status: <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${invoiceStatusClass(bill.paymentStatus)}`}>{formatInvoiceStatus(bill.paymentStatus)}</span></div>
                    {bill.notes && <div className="mt-2 text-sm text-brand-slate">📝 Notes: {bill.notes}</div>}
                    <div className="mt-3">
                        <div className="font-semibold mb-1">Services:</div>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {bill.services?.map((srv, idx) => (
                                <li key={idx}>
                                    {srv.description} — {formatXcd(srv.price)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-3">
                        <div className="font-semibold mb-1">Parts Used:</div>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {Array.isArray(bill.maintenanceId?.partsUsed) &&
                                bill.maintenanceId.partsUsed.length > 0 ? (
                                bill.maintenanceId.partsUsed.map((part, idx) => <li key={idx}>{part.name}</li>)
                            ) : (
                                <li className="text-brand-slate">None</li>
                            )}
                        </ul>
                    </div>

                    <div className="mt-3 font-bold text-right text-lg">
                        💰 Amount: {formatXcd(bill.totalPrice)}
                    </div>
                </div>

                {/* Buttons are hidden in print */}
                <div className="flex flex-col items-end gap-2 no-print">
                    {onEdit && (
                        <button onClick={onEdit} className="bg-brand-gold text-white px-5 py-2 rounded hover:bg-brand-highlight">
                            ✏️ Edit
                        </button>
                    )}
                    {onArchive && (
                        <button onClick={onArchive} className="bg-brand-error text-white px-3 py-2 rounded hover:bg-brand-error">
                            📦 Archive
                        </button>
                    )}
                    {onPrint && (
                        <button onClick={onPrint} className="bg-brand-navy text-white px-5 py-2 rounded hover:bg-brand-deep">
                            🖶️ Print
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
