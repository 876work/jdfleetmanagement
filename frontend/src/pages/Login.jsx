// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { getApiErrorMessage } from "../utils/errorMessages";
import { useAuth } from "../context/useAuth";

function Login() {
  const [username, setUsername] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth?.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Call the backend via the shared axios instance.
      const res = await api.post("/api/auth/login", {
        username,
        passwordHash,
      });

      // Save token + user in localStorage and context
      const authData = { token: res.data.token, user: res.data.user };
      localStorage.setItem("auth", JSON.stringify(authData));
      login(authData);

      setMessage("✅ Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage("❌ " + getApiErrorMessage(err, "Login failed. Please check your username and password."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-deep via-brand-navy to-brand-gold/80 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 md:grid md:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-brand-soft p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-brand-neutral bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              JD Carriers Operations
            </div>
            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">
              Welcome to JD Fleet Management
            </h1>
            <p className="mt-4 text-lg font-medium text-brand-navy">
              Professional fleet operations for JD Carriers
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-slate">
              Manage vehicles, drivers, maintenance, bookings, and reporting from one secure dashboard.
            </p>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-brand-slate sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-border bg-white p-4">Reliable fleet visibility</div>
            <div className="rounded-2xl border border-brand-border bg-white p-4">Secure operational access</div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-8 text-center">
            <img
              src="/JD_Carriers_logo.svg"
              alt="JD Carriers logo"
              className="mx-auto h-24 w-auto object-contain"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
            <h2 className="mt-5 text-2xl font-bold text-brand-deep">JD Fleet Management</h2>
            <p className="mt-2 text-sm text-brand-slate">
              Manage vehicles, drivers, maintenance, bookings, and fleet operations in one secure platform.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-brand-border px-4 py-3 text-brand-text outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordHash}
              onChange={(e) => setPasswordHash(e.target.value)}
              required
              className="w-full rounded-xl border border-brand-border px-4 py-3 text-brand-text outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-navy py-3 font-semibold text-white shadow-lg shadow-brand-navy/20 transition hover:bg-brand-deep"
            >
              Sign in to dashboard
            </button>
          </form>

          {message && <p className={`mt-4 text-sm ${message.startsWith("✅") ? "text-brand-success" : "text-brand-error"}`}>{message}</p>}

          <p className="mt-6 text-center text-sm text-brand-slate">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-brand-gold hover:underline">
              Sign up here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
