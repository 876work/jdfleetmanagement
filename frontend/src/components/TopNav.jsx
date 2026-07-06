// src/components/TopNav.jsx
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function TopNav() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout?.();
        navigate("/", { replace: true });
    };

    return (
        <header className="sticky top-0 z-40 border-b border-brand-border bg-white/95 shadow-sm backdrop-blur">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <button
                    className="flex items-center gap-3 rounded-xl py-2 pr-2 text-left transition hover:bg-brand-soft/70"
                    onClick={() => navigate("/dashboard")}
                    title="Go to JD Fleet Management Dashboard"
                >
                    <img
                        src="/JD_Carriers_logo.svg"
                        alt="JD Carriers logo"
                        className="h-10 w-auto object-contain"
                        onError={(event) => { event.currentTarget.style.display = "none"; }}
                    />
                    <span className="leading-tight">
                        <span className="block text-sm font-extrabold tracking-wide text-brand-deep sm:text-base">JD Fleet Management</span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">JD Carriers</span>
                    </span>
                </button>

                <nav className="hidden items-center gap-2 text-sm md:flex">
                    <AppLink to="/dashboard">Dashboard</AppLink>
                    <AppLink to="/vehicles">Vehicles</AppLink>
                    <AppLink to="/maintenance">Maintenance</AppLink>
                    <AppLink to="/invoices">Reports</AppLink>
                    {auth?.user?.role === "admin" && <AppLink to="/users">Users</AppLink>}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <span className="text-sm text-brand-slate">
                        {auth?.user?.username ? `Hi, ${auth.user.username}` : "Logged in"}
                    </span>
                    <button onClick={handleLogout} className="btn-danger" title="Logout">Logout</button>
                </div>

                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="btn-secondary px-3 md:hidden"
                    aria-expanded={menuOpen}
                    aria-label="Toggle navigation menu"
                >
                    {menuOpen ? "Close" : "Menu"}
                </button>
            </div>

            {menuOpen && (
                <div className="border-t border-brand-border bg-white px-4 py-3 shadow-sm md:hidden">
                    <nav className="mx-auto grid max-w-7xl gap-2 text-sm">
                        <MobileLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
                        <MobileLink to="/vehicles" onClick={() => setMenuOpen(false)}>Vehicles</MobileLink>
                        <MobileLink to="/maintenance" onClick={() => setMenuOpen(false)}>Maintenance</MobileLink>
                        <MobileLink to="/invoices" onClick={() => setMenuOpen(false)}>Reports</MobileLink>
                        <div className="mt-2 flex items-center justify-between gap-3 border-t border-brand-border pt-3">
                            <span className="truncate text-sm text-brand-slate">{auth?.user?.username ? `Hi, ${auth.user.username}` : "Logged in"}</span>
                            <button onClick={handleLogout} className="btn-danger">Logout</button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

function AppLink({ to, children }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                [
                    "rounded-xl px-3 py-2 font-semibold transition hover:bg-brand-soft hover:text-brand-navy",
                    isActive ? "bg-brand-navy text-white shadow-sm" : "text-brand-slate",
                ].join(" ")
            }
        >
            {children}
        </NavLink>
    );
}

function MobileLink({ to, children, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                [
                    "rounded-xl px-4 py-3 font-semibold transition",
                    isActive ? "bg-brand-navy text-white" : "bg-brand-soft text-brand-deep",
                ].join(" ")
            }
        >
            {children}
        </NavLink>
    );
}
