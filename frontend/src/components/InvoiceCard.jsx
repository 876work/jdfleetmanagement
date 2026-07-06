// src/components/InvoiceCard.jsx
import React from "react";
import InvoiceDocument from "./InvoiceDocument";

// Note: Buttons are given the "no-print" class so they are only visible on the screen, not in print.
export default function InvoiceCard({
    bill,
    onEdit,
    onArchive,
    onPrint,
    className = "",
}) {
    if (!bill) return null;

    const actions = (
        <>
            {onEdit && <button onClick={onEdit} className="btn-warning">✏️ Edit</button>}
            {onArchive && <button onClick={onArchive} className="btn-danger">📦 Archive</button>}
            {onPrint && <button onClick={onPrint} className="btn-secondary">Print Invoice</button>}
        </>
    );

    return <InvoiceDocument bill={bill} actions={actions} className={className} />;
}
