import React, { useState } from "react";

const LOGO_SVG = "/JD_Carriers_logo.svg";
const LOGO_PNG = "/JD_Carriers_logo.png";

export const formatXcdCurrency = (value) =>
    `XCD $${Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export const formatInvoiceDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
          })
        : "N/A";

export const formatInvoiceStatus = (status = "unpaid") =>
    status.charAt(0).toUpperCase() + status.slice(1);

export const invoiceStatusClass = (status = "unpaid") =>
    ({
        paid: "bg-green-100 text-green-800 border-green-200",
        overdue: "bg-red-100 text-red-800 border-red-200",
        cancelled: "bg-gray-200 text-gray-700 border-gray-300",
        unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }[status] || "bg-yellow-100 text-yellow-800 border-yellow-200");

function InvoiceLogo() {
    const [logoSrc, setLogoSrc] = useState(LOGO_SVG);
    const [showTextFallback, setShowTextFallback] = useState(false);

    if (showTextFallback) {
        return (
            <div className="invoice-logo-fallback">
                <span>JD Carriers</span>
                <small>JD Fleet Management</small>
            </div>
        );
    }

    return (
        <img
            src={logoSrc}
            alt="JD Carriers logo"
            className="invoice-logo"
            onError={() => {
                if (logoSrc === LOGO_SVG) {
                    setLogoSrc(LOGO_PNG);
                    return;
                }
                setShowTextFallback(true);
            }}
        />
    );
}

const getCustomerName = (customer) =>
    customer ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer" : "Unknown customer";

const getVehicleName = (vehicle) =>
    vehicle
        ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || vehicle.name || "Vehicle"
        : "Vehicle not specified";

export default function InvoiceDocument({ bill, actions = null, className = "" }) {
    if (!bill) return null;

    const services = Array.isArray(bill.services) ? bill.services : [];
    const partsUsed = Array.isArray(bill.maintenanceId?.partsUsed) ? bill.maintenanceId.partsUsed : [];
    const invoiceId = bill.invoiceNumber || bill.invoiceId || bill._id;
    const status = bill.paymentStatus || "unpaid";

    return (
        <article className={`invoice-document ${className}`}>
            <header className="invoice-document-header">
                <div className="invoice-brand-block">
                    <InvoiceLogo />
                    <div>
                        <p className="invoice-brand-name">JD Fleet Management</p>
                        <p className="invoice-brand-subtitle">Professional fleet service and billing</p>
                    </div>
                </div>

                <div className="invoice-title-block">
                    <h1>Invoice</h1>
                    <p>{invoiceId ? `#${invoiceId}` : "Invoice ID pending"}</p>
                    <span className={`invoice-status-badge ${invoiceStatusClass(status)}`}>
                        {formatInvoiceStatus(status)}
                    </span>
                </div>
            </header>

            <section className="invoice-meta-grid">
                <div className="invoice-info-card">
                    <span>Invoice Date</span>
                    <strong>{formatInvoiceDate(bill.date)}</strong>
                </div>
                <div className="invoice-info-card">
                    <span>Customer / Owner</span>
                    <strong>{getCustomerName(bill.customer)}</strong>
                </div>
                <div className="invoice-info-card">
                    <span>Vehicle</span>
                    <strong>{getVehicleName(bill.vehicle)}</strong>
                    {bill.vehicle?.plateNumber && <small>Plate: {bill.vehicle.plateNumber}</small>}
                </div>
            </section>

            <section className="invoice-section">
                <div className="invoice-section-heading">
                    <h2>Service Details</h2>
                    <span>All amounts in XCD</span>
                </div>

                <div className="invoice-line-table-wrap">
                    <table className="invoice-line-table">
                        <thead>
                            <tr>
                                <th>Service / Description</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length > 0 ? (
                                services.map((service, index) => (
                                    <tr key={`${service.description}-${index}`}>
                                        <td>{service.description || "Service item"}</td>
                                        <td className="text-right font-semibold">{formatXcdCurrency(service.price)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="text-center text-brand-slate">No service line items listed.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {(partsUsed.length > 0 || bill.maintenanceId?.description) && (
                <section className="invoice-section invoice-muted-panel">
                    <h2>Maintenance / Bill Description</h2>
                    {bill.maintenanceId?.description && <p>{bill.maintenanceId.description}</p>}
                    {partsUsed.length > 0 && (
                        <ul className="invoice-parts-list">
                            {partsUsed.map((part, index) => <li key={part._id || `${part.name}-${index}`}>{part.name || "Part used"}</li>)}
                        </ul>
                    )}
                </section>
            )}

            {bill.notes && (
                <section className="invoice-section invoice-notes">
                    <h2>Notes</h2>
                    <p>{bill.notes}</p>
                </section>
            )}

            <section className="invoice-total-row">
                <span>Total Amount Due</span>
                <strong>{formatXcdCurrency(bill.totalPrice)}</strong>
            </section>

            {actions && <div className="invoice-actions no-print">{actions}</div>}

            <footer className="invoice-footer">
                <strong>JD Fleet Management</strong>
                <span>Thank you for choosing JD Carriers for your fleet management needs.</span>
            </footer>
        </article>
    );
}
