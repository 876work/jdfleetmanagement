import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";
import { motion as Motion } from "framer-motion";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

const formatDate = (dateValue) => {
    if (!dateValue) return "No date recorded";
    return new Date(dateValue).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const vehicleTitle = (vehicle = {}) =>
    [vehicle.brand, vehicle.model, vehicle.plateNumber].filter(Boolean).join(" • ") || "Unknown vehicle";

export default function Dashboard() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get("/api/dashboard/summary?limit=5&lowStockThreshold=5&attentionDays=180");
                setDashboard(res.data);
            } catch (err) {
                console.error("Dashboard summary error:", err);
                setError("Unable to load the dashboard summary right now.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const counts = dashboard?.counts || {};
    const recentMaintenance = dashboard?.recentMaintenance || [];
    const recentInvoices = dashboard?.recentInvoices || [];
    const vehiclesNeedingAttention = dashboard?.vehiclesNeedingAttention || [];
    const lowStockParts = dashboard?.lowStockParts || [];
    const lowStockThreshold = dashboard?.settings?.lowStockThreshold || 5;

    return (
        <div className="app-shell">
            <div className="app-container">
                <section className="page-header flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="eyebrow">Fleet command center</p>
                        <h1 className="page-title">JD Fleet Management Dashboard</h1>
                        <p className="page-description">
                            Track fleet size, owners, service work, billing activity, vehicles that may be overdue for service, and parts that need restocking.
                        </p>
                        <p className="mt-3 text-brand-slate">
                            {auth?.user?.username ? `Welcome, ${auth.user.username}!` : "Welcome!"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                        <ActionButton onClick={() => navigate("/vehicles")}>🚗 Vehicles</ActionButton>
                        <ActionButton onClick={() => navigate("/maintenance")} variant="gold">🛠️ Maintenance</ActionButton>
                        <ActionButton onClick={() => navigate("/invoices")} variant="deep">🧾 Invoices</ActionButton>
                    </div>
                </section>

                {error && (
                    <div className="mt-6 rounded-xl border border-brand-error bg-white p-4 text-sm text-brand-error shadow-sm">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Vehicles" value={counts.vehicles} subtitle="Fleet assets" icon="🚘" loading={loading} color="from-brand-navy to-brand-deep" />
                    <StatCard title="Customers / Owners" value={counts.customers} subtitle="Vehicle owners" icon="👥" loading={loading} color="from-brand-deep to-brand-navy" />
                    <StatCard title="Maintenance Records" value={counts.maintenanceRecords} subtitle="Service history" icon="🛠️" loading={loading} color="from-brand-gold to-brand-highlight" />
                    <StatCard title="Invoices" value={counts.invoices} subtitle="Active bills" icon="🧾" loading={loading} color="from-brand-highlight to-brand-gold" />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Panel title="Recent Maintenance Activity" actionLabel="View all" onAction={() => navigate("/maintenance")}>
                        {loading ? <ListSkeleton /> : <MaintenanceList records={recentMaintenance} />}
                    </Panel>

                    <Panel title="Recent Invoices" actionLabel="View invoices" onAction={() => navigate("/invoices")}>
                        {loading ? <ListSkeleton /> : <InvoiceList invoices={recentInvoices} />}
                    </Panel>

                    <Panel title="Vehicles Needing Attention" actionLabel="Manage vehicles" onAction={() => navigate("/vehicles")} tone="warning">
                        {loading ? <ListSkeleton /> : <AttentionList vehicles={vehiclesNeedingAttention} />}
                    </Panel>

                    <Panel title={`Low Stock Parts (< ${lowStockThreshold})`} tone="warning">
                        {loading ? <ListSkeleton /> : <LowStockList parts={lowStockParts} navigate={navigate} />}
                    </Panel>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ children, onClick, variant = "navy" }) {
    const classes = {
        navy: "bg-brand-navy hover:bg-brand-deep",
        gold: "bg-brand-gold hover:bg-brand-highlight",
        deep: "bg-brand-deep hover:bg-brand-navy",
    };

    return (
        <button onClick={onClick} className={`${classes[variant]} rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition`}>
            {children}
        </button>
    );
}

function StatCard({ title, value = 0, subtitle, icon, loading, color }) {
    return (
        <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`h-2 bg-gradient-to-r ${color}`} />
            <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-3xl">{icon}</div>
                    <div className="text-right text-xs font-medium uppercase tracking-wide text-brand-slate">{subtitle}</div>
                </div>
                <h3 className="mt-4 font-semibold text-brand-slate">{title}</h3>
                {loading ? <div className="mt-2 h-9 w-20 animate-pulse rounded bg-brand-neutral" /> : <p className="mt-1 text-4xl font-bold text-brand-text">{value}</p>}
            </div>
        </Motion.div>
    );
}

function Panel({ title, children, actionLabel, onAction, tone = "default" }) {
    const borderClass = tone === "warning" ? "border-l-4 border-l-brand-warning" : "";

    return (
        <Motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`card-pad ${borderClass}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-brand-deep">{title}</h2>
                {actionLabel && <button onClick={onAction} className="text-sm font-semibold text-brand-navy hover:text-brand-deep">{actionLabel}</button>}
            </div>
            {children}
        </Motion.section>
    );
}

function MaintenanceList({ records }) {
    if (!records.length) return <EmptyState>No maintenance records available.</EmptyState>;

    return (
        <ul className="divide-y divide-brand-neutral">
            {records.map((record) => {
                const total = (record.services || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

                return (
                    <li key={record._id} className="py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-medium text-brand-text">{vehicleTitle(record.vehicleId)}</p>
                                <p className="mt-1 text-xs text-brand-slate">{formatDate(record.serviceDate)} • {record.services?.length || 0} service items</p>
                            </div>
                            <p className="text-sm font-semibold text-brand-slate">{currencyFormatter.format(total)}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function InvoiceList({ invoices }) {
    if (!invoices.length) return <EmptyState>No invoices available.</EmptyState>;

    return (
        <ul className="divide-y divide-brand-neutral">
            {invoices.map((invoice) => {
                const customerName = [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(" ") || "Unknown customer";
                const total = Number(invoice.totalPrice || invoice.total || 0);

                return (
                    <li key={invoice._id} className="py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-medium text-brand-text">{vehicleTitle(invoice.vehicle)}</p>
                                <p className="mt-1 text-xs text-brand-slate">{customerName} • {formatDate(invoice.date)}</p>
                            </div>
                            <p className="text-sm font-semibold text-brand-slate">{currencyFormatter.format(total)}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function AttentionList({ vehicles }) {
    if (!vehicles.length) return <EmptyState>No vehicles need attention based on existing maintenance records.</EmptyState>;

    return (
        <ul className="divide-y divide-brand-neutral">
            {vehicles.map((item) => (
                <li key={item._id} className="py-3">
                    <p className="font-medium text-brand-text">{item.title}</p>
                    <p className="mt-1 text-xs text-brand-slate">{item.reason}{item.lastServiceDate ? ` • Last serviced ${formatDate(item.lastServiceDate)}` : ""}</p>
                </li>
            ))}
        </ul>
    );
}

function LowStockList({ parts, navigate }) {
    if (!parts.length) return <EmptyState>Parts inventory is sufficiently stocked.</EmptyState>;

    return (
        <ul className="divide-y divide-brand-neutral">
            {parts.map((part) => (
                <li key={part._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-medium text-brand-text">{part.name}</p>
                        <p className="mt-1 text-xs text-brand-slate">{part.quantity} in stock</p>
                    </div>
                    <button onClick={() => navigate(`/parts/${part._id}/order`)} className="rounded-lg bg-brand-gold px-3 py-2 text-xs font-semibold text-white hover:bg-brand-highlight">
                        Order part
                    </button>
                </li>
            ))}
        </ul>
    );
}

function EmptyState({ children }) {
    return <div className="empty-state py-6"><p>{children}</p></div>;
}

function ListSkeleton() {
    return (
        <ul className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <li key={i} className="animate-pulse">
                    <div className="h-4 w-2/3 rounded bg-brand-neutral" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-brand-soft" />
                </li>
            ))}
        </ul>
    );
}
