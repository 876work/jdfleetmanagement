import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { getApiErrorMessage } from "../utils/errorMessages";
import { useAuth } from "../context/useAuth";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/auth/register", {
        username,
        passwordHash: password,
      });

      const authData = { token: res.data.token, user: res.data.user };
      login(authData);

      setMessage("✅ Registration successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage(`❌ ${getApiErrorMessage(err, "Registration failed. Please check the form and try again.")}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft px-4">
      <div className="bg-white shadow-md rounded p-6 w-full max-w-sm text-center">
        <div className="mb-6">
          <img
            src="/JD_Carriers_logo.svg"
            alt="JD Carriers logo"
            className="mx-auto h-20 w-auto object-contain"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">JD Carriers</p>
          <h2 className="text-2xl font-bold mt-1 text-brand-deep">JD Fleet Management</h2>
          <p className="text-sm text-brand-slate mt-1">Create your account to access secure fleet operations.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-brand-border px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-brand-border px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-brand-border px-3 py-2 rounded"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-navy text-white py-2 rounded hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-brand-neutral"
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-brand-error">{message}</p>}

        <p className="mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-brand-navy hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
