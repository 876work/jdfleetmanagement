import React from "react";
import InvoiceDocument from "./InvoiceDocument";

export default function InvoiceModal({ visible, onClose, invoice }) {
    if (!visible || !invoice) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="w-full max-w-5xl">
                <InvoiceDocument
                    invoice={invoice}
                    actions={
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
