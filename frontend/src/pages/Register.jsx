import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
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
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage(`❌ Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-md rounded p-6 w-full max-w-sm text-center">
        <div className="mb-6">
          <img src="/logo.png" alt="App Logo" className="mx-auto w-16 h-16" />
          <h2 className="text-2xl font-bold mt-2">Create Account</h2>
          <p className="text-sm text-gray-500 mt-1">Sign up to access JD Fleet Management.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <p className="mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
