import React, { forwardRef } from "react";
import InvoiceDocument from "./InvoiceDocument";

const InvoicePrintModal = forwardRef(({ bill, onCancel, onConfirm }, ref) => {
    if (!bill) return null;

    return (
        <div ref={ref}>
            <InvoiceDocument
                bill={bill}
                actions={
                    <>
                        <button onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button onClick={onConfirm} className="btn-primary">Print Invoice</button>
                    </>
                }
            />
        </div>
    );
});

export default InvoicePrintModal;
