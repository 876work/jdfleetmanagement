// src/components/TopNav.jsx
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function TopNav() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // NOTE: Clear auth and go to login
        logout?.();
        navigate("/", { replace: true });
    };

    return (
        <header className="sticky top-0 z-40 border-b border-brand-border bg-white/95 shadow-sm backdrop-blur">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => navigate("/dashboard")}
                    title="Go to JD Fleet Management Dashboard"
                >
                    <img
                        src="/JD_Carriers_logo.svg"
                        alt="JD Carriers logo"
                        className="h-10 w-auto object-contain"
                        onError={(event) => { event.currentTarget.style.display = "none"; }}
                    />
                    <span className="hidden sm:block leading-tight">
                        <span className="block text-sm font-extrabold tracking-wide text-brand-deep">JD Fleet Management</span>
                        <span className="block text-xs font-medium text-brand-gold">JD Carriers</span>
                    </span>
                </button>

                <nav className="hidden md:flex items-center gap-2 text-sm">
                    <AppLink to="/dashboard">Dashboard</AppLink>
                    <AppLink to="/vehicles">Vehicles</AppLink>
                    <AppLink to="/maintenance">Maintenance</AppLink>
                    <AppLink to="/invoices">Reports</AppLink>
                </nav>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-brand-slate text-sm">
                        {auth?.user?.username ? `Hi, ${auth.user.username}` : "Logged in"}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg bg-brand-error px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-800"
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}

function AppLink({ to, children }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                [
                    "px-3 py-2 rounded-lg transition hover:bg-brand-soft hover:text-brand-navy",
                    isActive ? "bg-brand-navy text-white font-semibold shadow-sm" : "text-brand-slate",
                ].join(" ")
            }
        >
            {children}
        </NavLink>
    );
}
