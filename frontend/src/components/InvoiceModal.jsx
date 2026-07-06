import React from "react";
import InvoiceDocument from "./InvoiceDocument";

export default function InvoiceModal({ visible, onClose, invoice }) {
    if (!visible || !invoice) return null;

    return (
        <div className="invoice-print-overlay">
            <InvoiceDocument
                bill={invoice}
                actions={
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                }
            />
        </div>
    );
}
