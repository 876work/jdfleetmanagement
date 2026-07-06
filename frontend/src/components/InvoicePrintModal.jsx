import React, { forwardRef } from "react";
import InvoiceDocument from "./InvoiceDocument";

const InvoicePrintModal = forwardRef(({ bill, onCancel, onConfirm }, ref) => {
    if (!bill) return null;

    return (
        <div ref={ref} className="invoice-print-surface bg-white p-4 print:p-0">
            <InvoiceDocument
                invoice={bill}
                actions={
                    <div className="flex flex-col justify-end gap-3 sm:flex-row">
                        <button onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button onClick={onConfirm} className="btn-primary">Print</button>
                    </div>
                }
            />
        </div>
    );
});

export default InvoicePrintModal;
