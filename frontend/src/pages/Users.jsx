import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/useAuth";
import api from "../utils/axiosInstance";

export default function Users() {
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = auth?.user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      try {
        const res = await api.get("/api/users");
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin]);

  const updateRole = async (userId, role) => {
    try {
      const res = await api.patch(`/api/users/${userId}/role`, { role });
      setUsers((current) => current.map((user) => (user.id === userId ? res.data : user)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update role");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink">
      <TopNav />
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Admin</p>
          <h1 className="text-3xl font-extrabold text-brand-deep">User Management</h1>
          <p className="text-brand-slate">Admins can review users, assign roles, and remove staff accounts.</p>
        </div>

        {!isAdmin && (
          <div className="rounded-xl border border-brand-border bg-white p-6 text-brand-error shadow-sm">
            You do not have permission to manage users.
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-brand-error">{error}</div>}

        {isAdmin && loading && <p className="text-brand-slate">Loading users...</p>}

        {isAdmin && !loading && (
          <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-brand-border text-sm">
              <thead className="bg-brand-soft text-left text-brand-deep">
                <tr>
                  <th className="px-4 py-3 font-bold">Username</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-semibold text-brand-deep">{user.username}</td>
                    <td className="px-4 py-3 text-brand-slate">{user.email || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(event) => updateRole(user.id, event.target.value)}
                        className="rounded-lg border border-brand-border px-3 py-2"
                      >
                        <option value="admin">admin</option>
                        <option value="staff">staff</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        disabled={auth?.user?.id === user.id}
                        className="rounded-lg bg-brand-error px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
