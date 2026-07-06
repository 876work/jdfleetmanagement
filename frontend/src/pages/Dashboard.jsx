import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";
import { motion } from "framer-motion";

export default function Dashboard() {
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        vehicles: 0,
        maintenances: 0,
        invoices: 0,
    });
    const [loading, setLoading] = useState(true);

    // recent lists + states
    const [recentMaint, setRecentMaint] = useState([]);
    const [recentBills, setRecentBills] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [recentError, setRecentError] = useState(null);

    //Low stock state
    const [lowStockParts, setLowStockParts] = useState([]);
    const [loadingStock, setLoadingStock] = useState(true);
    const [stockError, setStockError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [vRes, mRes, bRes] = await Promise.all([
                    axios.get("/api/vehicles"),
                    axios.get("/api/maintenance"),
                    axios.get("/api/bills"),
                ]);

                setStats({
                    vehicles: vRes.data?.length || 0,
                    maintenances: mRes.data?.length || 0,
                    invoices: bRes.data?.length || 0,
                });
            } catch (err) {
                // NOTE: keep silent, can add toast later
                console.error("Dashboard stats error:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchRecent = async () => {
            setLoadingRecent(true);
            setRecentError(null);
            try {
                // request 5 most recent items
                const [maintRes, billsRes] = await Promise.all([
                    axios.get("/api/maintenance/recent?limit=5"),
                    axios.get("/api/bills/recent?limit=5"),
                ]);

                setRecentMaint(Array.isArray(maintRes.data) ? maintRes.data : []);
                setRecentBills(Array.isArray(billsRes.data) ? billsRes.data : []);
            } catch (err) {
                console.error("Dashboard recent error:", err);

                setRecentError("Unable to load recent fleet activity.");
            } finally {
                setLoadingRecent(false);
            }
        };

        const fetchLowStock = async () => {
            setLoadingStock(true);
            setStockError(null);

            try {
                const token = auth?.token;
                const res = await axios.get("/api/parts/low-stock?threshold=5", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLowStockParts(res.data || []);
            } catch (err) {
                console.error("Error fetching low stock parts", err);
                setStockError("Failed to fetch low stock parts");
            } finally {
                setLoadingStock(false);
            }
        };


        fetchStats();
        fetchRecent();
        fetchLowStock();
    }, []);


    return (
        <div className="min-h-screen bg-brand-soft">
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-deep">JD Fleet Management Dashboard</h1>
                        <p className="mt-2 max-w-3xl text-brand-slate">A clear overview of fleet activity, vehicle status, driver assignments, maintenance, and operational performance.</p>
                        <p className="text-brand-slate mt-3">
                            {auth?.user?.username ? `Welcome, ${auth.user.username}!` : "Welcome!"}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        {/* NOTE: We navigate to existing pages */}
                        <button
                            onClick={() => navigate("/vehicles")}
                            className="bg-brand-navy text-white px-4 py-2 rounded-lg hover:bg-brand-deep"
                        >
                            🚗 Vehicles
                        </button>
                        <button
                            onClick={() => navigate("/maintenance")}
                            className="bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-brand-highlight"
                        >
                            🛠️ Maintenance
                        </button>
                        <button
                            onClick={() => navigate("/invoices")}
                            className="bg-brand-deep text-white px-4 py-2 rounded-lg hover:bg-brand-navy"
                        >
                            📊 Reports
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    <StatCard
                        title="Vehicles"
                        value={stats.vehicles}
                        subtitle="Active fleet assets"
                        icon="🚘"
                        loading={loading}
                        color="from-brand-navy to-brand-deep"
                    />
                    <StatCard
                        title="Maintenance"
                        value={stats.maintenances}
                        subtitle="All records"
                        icon="🛠️"
                        loading={loading}
                        color="from-brand-gold to-brand-highlight"
                    />
                    <StatCard
                        title="Reports"
                        value={stats.invoices}
                        subtitle="Operational documents"
                        icon="🧾"
                        loading={loading}
                        color="from-brand-deep to-brand-navy"
                    />
                </div>

                {/* Recent Section (placeholder) */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white border border-brand-border rounded-xl p-4 shadow-sm"
                    >
                        <h2 className="font-semibold text-lg mb-3 text-brand-deep">Recent Maintenance</h2>

                        {loadingRecent ? (
                            <ListSkeleton />
                        ) : recentError ? (
                            <p className="text-brand-error text-sm">{recentError}</p>
                        ) : recentMaint.length === 0 ? (
                            <p className="text-brand-slate text-sm">No maintenance records available.</p>
                        ) : (
                            <ul className="divide-y">
                                {recentMaint.map((rec) => {
                                    // derive title and totals safely
                                    const v = rec?.vehicleId || {};
                                    const title = v.brand
                                        ? `${v.brand} ${v.model || ""} • ${v.plateNumber || ""}`
                                        : `Maintenance ${rec?._id?.slice(-6) || ""}`;
                                    const date = rec?.serviceDate ? new Date(rec.serviceDate) : null;
                                    const total = Array.isArray(rec?.services)
                                        ? rec.services.reduce((s, it) => s + (Number(it.cost) || 0), 0)
                                        : 0;

                                    return (
                                        <li key={rec._id} className="py-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-brand-text">{title}</p>
                                                    <p className="text-xs text-brand-slate mt-0.5">
                                                        {date ? date.toLocaleDateString() : "No date"} • {rec?.services?.length || 0} services
                                                    </p>
                                                </div>
                                                <div className="text-sm font-semibold text-brand-slate">
                                                    {total.toLocaleString()} $
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="bg-white border border-brand-border rounded-xl p-4 shadow-sm"
                    >
                        <h2 className="font-semibold text-lg mb-3 text-brand-deep">Recent Reports</h2>
                        {loadingRecent ? (
                            <ListSkeleton />
                        ) : recentError ? (
                            <p className="text-brand-error text-sm">{recentError}</p>
                        ) : recentBills.length === 0 ? (
                            <p className="text-brand-slate text-sm">No reports available at this time.</p>
                        ) : (
                            <ul className="divide-y">
                                {recentBills.map((bill) => {
                                    const v = bill?.vehicle || {};
                                    const c = bill?.customer || {};
                                    const title = v.brand
                                        ? `${v.brand} ${v.model || ""} • ${v.plateNumber || ""}`
                                        : `Invoice ${bill?._id?.slice(-6) || ""}`;
                                    const name =
                                        c.firstName || c.lastName
                                            ? `${c.firstName || ""} ${c.lastName || ""}`.trim()
                                            : "Unknown customer";
                                    const date = bill?.date ? new Date(bill.date) : null;
                                    const total = Number(bill?.totalPrice || bill?.total || 0);

                                    return (
                                        <li key={bill._id} className="py-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-brand-text">{title}</p>
                                                    <p className="text-xs text-brand-slate mt-0.5">
                                                        {name} • {date ? date.toLocaleDateString() : "No date"}
                                                    </p>
                                                </div>
                                                <div className="text-sm font-semibold text-brand-slate">
                                                    {total.toLocaleString()} $
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-brand-tint border-l-4 border-brand-warning p-4 shadow-md rounded-lg"
                    >
                        <div className="flex items-center mb-2">
                            <span className="text-brand-warning text-xl mr-2">⚠️</span>
                            <h2 className="font-semibold text-lg text-brand-warning">Low Stock Parts</h2>
                        </div>

                        {loadingStock ? (
                            <ListSkeleton />
                        ) : stockError ? (
                            <p className="text-brand-error text-sm">{stockError}</p>
                        ) : lowStockParts.length === 0 ? (
                            <p className="text-brand-slate text-sm">Fleet parts inventory is sufficiently stocked.</p>
                        ) : (
                            <ul className="divide-y divide-brand-neutral">
                                {lowStockParts.map((part) => (
                                    <li key={part._id} className="py-2 flex justify-between items-center">
                                        <span className="font-medium text-brand-warning">{part.name}</span>
                                        <span className="bg-brand-tint text-brand-warning text-sm px-2 py-1 rounded-full">
                                            {part.quantity} left
                                        </span>
                                        <button
                                            onClick={() => navigate(`/parts/${part._id}/order`)}
                                            className="ml-2 bg-brand-gold text-white px-2 py-1 text-xs rounded hover:bg-brand-highlight"
                                        >
                                            Order a Part
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>


                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------
 * Small, reusable Stat Card component
 * ---------------------------------------------- */
function StatCard({ title, value, subtitle, icon, loading, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
        >
            <div className={`h-2 bg-gradient-to-r ${color}`} />
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <div className="text-2xl">{icon}</div>
                    <div className="text-xs text-brand-slate">{subtitle}</div>
                </div>
                <h3 className="mt-3 text-brand-slate font-semibold">{title}</h3>
                <div className="mt-1">
                    {loading ? (
                        // NOTE: Simple skeleton shimmer
                        <div className="h-8 w-16 bg-brand-neutral animate-pulse rounded" />
                    ) : (
                        <p className="text-3xl font-bold">{value}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function ListSkeleton() {
    // simple 4-row skeleton loader
    return (
        <ul className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <li key={i} className="animate-pulse">
                    <div className="h-4 bg-brand-neutral rounded w-2/3" />
                    <div className="h-3 bg-brand-soft rounded w-1/3 mt-2" />
                </li>
            ))}
        </ul>
    );
}
