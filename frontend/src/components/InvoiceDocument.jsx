import React, { useState } from "react";

export const JD_CARRIERS_LOGO_PATH = "/JD_Carriers_logo.svg";
export const JD_CARRIERS_LOGO_FALLBACK_PATH = "/JD_Carriers_logo.png";

export const formatXcd = (value) =>
    `XCD $${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const formatInvoiceStatus = (status = "unpaid") =>
    status.charAt(0).toUpperCase() + status.slice(1);

export const invoiceStatusClass = (status = "unpaid") =>
    ({
        draft: "bg-blue-100 text-blue-800 border-blue-200",
        paid: "bg-green-100 text-green-800 border-green-200",
        overdue: "bg-red-100 text-red-800 border-red-200",
        cancelled: "bg-gray-200 text-gray-700 border-gray-300",
        unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }[status] || "bg-yellow-100 text-yellow-800 border-yellow-200");

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

const fullName = (person) =>
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "—";

function BrandMark() {
    const [logoSrc, setLogoSrc] = useState(JD_CARRIERS_LOGO_PATH);
    const [showTextFallback, setShowTextFallback] = useState(false);

    if (showTextFallback) {
        return (
            <div className="flex h-16 w-44 flex-col justify-center rounded-xl border border-brand-border bg-white px-4 shadow-sm">
                <span className="text-lg font-extrabold leading-tight text-brand-deep">JD Carriers</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">JD Fleet Management</span>
            </div>
        );
    }

    return (
        <img
            src={logoSrc}
            alt="JD Carriers logo"
            className="h-16 w-auto max-w-[190px] object-contain"
            onError={() => {
                if (logoSrc === JD_CARRIERS_LOGO_PATH) {
                    setLogoSrc(JD_CARRIERS_LOGO_FALLBACK_PATH);
                } else {
                    setShowTextFallback(true);
                }
            }}
        />
    );
}

export default function InvoiceDocument({ invoice, actions = null }) {
    if (!invoice) return null;

    const services = invoice.services || [];
    const parts = invoice.maintenanceId?.partsUsed || [];
    const invoiceNumber = invoice.invoiceNumber || invoice.invoiceId || invoice._id || "—";
    const maintenanceDescription =
        invoice.maintenanceId?.description ||
        invoice.maintenanceId?.notes ||
        invoice.description ||
        invoice.billDescription;

    return (
        <article className="invoice-document mx-auto max-w-4xl overflow-hidden rounded-3xl border border-brand-border bg-white text-brand-text shadow-xl print:rounded-none print:border-0 print:shadow-none">
            <header className="border-b border-brand-border bg-gradient-to-r from-white via-white to-brand-soft p-6 sm:p-8 print:bg-white">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <BrandMark />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">JD Fleet Management</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-deep sm:text-3xl">Invoice</h1>
                            <p className="mt-1 text-sm text-brand-slate">Professional fleet maintenance and carrier service billing.</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm shadow-sm sm:min-w-64 print:shadow-none">
                        <div className="flex justify-between gap-4"><span className="font-semibold text-brand-slate">Invoice #</span><span className="break-all font-bold text-brand-deep">{invoiceNumber}</span></div>
                        <div className="mt-2 flex justify-between gap-4"><span className="font-semibold text-brand-slate">Date</span><span>{formatDate(invoice.date)}</span></div>
                        <div className="mt-3 flex justify-between gap-4"><span className="font-semibold text-brand-slate">Status</span><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${invoiceStatusClass(invoice.paymentStatus)}`}>{formatInvoiceStatus(invoice.paymentStatus)}</span></div>
                    </div>
                </div>
            </header>

            <section className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div className="rounded-2xl border border-brand-border p-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-brand-deep">Bill To</h2>
                    <p className="mt-3 text-lg font-bold text-brand-text">{fullName(invoice.customer)}</p>
                    {invoice.customer?.email && <p className="text-sm text-brand-slate">{invoice.customer.email}</p>}
                    {invoice.customer?.phone && <p className="text-sm text-brand-slate">{invoice.customer.phone}</p>}
                </div>

                <div className="rounded-2xl border border-brand-border p-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-brand-deep">Vehicle</h2>
                    <p className="mt-3 text-lg font-bold text-brand-text">{[invoice.vehicle?.brand, invoice.vehicle?.model].filter(Boolean).join(" ") || invoice.vehicle?.name || "—"}</p>
                    <p className="text-sm text-brand-slate">Plate: {invoice.vehicle?.plateNumber || "—"}</p>
                </div>
            </section>

            {maintenanceDescription && (
                <section className="px-6 pb-4 sm:px-8">
                    <div className="rounded-2xl border border-brand-border bg-brand-soft/50 p-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-brand-deep">Maintenance / Bill Description</h2>
                        <p className="mt-2 text-sm leading-6 text-brand-slate">{maintenanceDescription}</p>
                    </div>
                </section>
            )}

            <section className="px-6 pb-6 sm:px-8">
                <div className="overflow-hidden rounded-2xl border border-brand-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-brand-deep text-white">
                            <tr><th className="px-4 py-3">Service / Line Item</th><th className="px-4 py-3 text-right">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {services.length > 0 ? services.map((service, index) => (
                                <tr key={index}><td className="px-4 py-3 text-brand-text">{service.description || "Service"}</td><td className="px-4 py-3 text-right font-semibold">{formatXcd(service.price)}</td></tr>
                            )) : <tr><td className="px-4 py-3 text-brand-slate">No services listed</td><td className="px-4 py-3 text-right">{formatXcd(0)}</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
                    <div className="rounded-2xl border border-brand-border p-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-brand-deep">Parts Used</h2>
                        <p className="mt-2 text-sm text-brand-slate">{parts.length > 0 ? parts.map((part) => part.name).join(", ") : "No parts used"}</p>
                    </div>
                    <div className="rounded-2xl bg-brand-deep p-5 text-white">
                        <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-brand-gold"><span>Total</span></div>
                        <div className="mt-2 text-right text-3xl font-black">{formatXcd(invoice.totalPrice)}</div>
                    </div>
                </div>

                {invoice.notes && <div className="mt-4 rounded-2xl border border-brand-border p-4"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-brand-deep">Notes</h2><p className="mt-2 text-sm leading-6 text-brand-slate">{invoice.notes}</p></div>}
            </section>

            <footer className="border-t border-brand-border bg-brand-soft px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep sm:px-8 print:bg-white">
                JD Fleet Management • JD Carriers • Thank you for your business
            </footer>

            {actions && <div className="no-print border-t border-brand-border bg-white p-4">{actions}</div>}
        </article>
    );
}
