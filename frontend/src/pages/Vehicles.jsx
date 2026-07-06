import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { motion as Motion, AnimatePresence } from "framer-motion";
import EditVehicleModal from "../components/EditVehicleModal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);


  const navigate = useNavigate();
  const { auth } = useAuth();

  const fetchAll = async () => {
    try {
      const [vehiclesRes, categoriesRes, ownersRes] = await Promise.all([
        axios.get("/api/vehicles"),
        axios.get("/api/categories"),
        axios.get("/api/customers")
      ]);
      setVehicles(vehiclesRes.data);
      setCategories(categoriesRes.data);
      setOwners(ownersRes.data);
    } catch (err) {
      setError("❌ Error fetching data: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const confirmDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/vehicles/${vehicleToDelete._id}`);
      setVehicles(prev => prev.filter(v => v._id !== vehicleToDelete._id));
      setConfirmVisible(false);
      setVehicleToDelete(null);
      toast.success("Vehicle deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete vehicle: " + (err.response?.data?.message || err.message));
    }
  };


  const handleUpdate = async (updatedVehicle) => {
    try {
      const res = await axios.put(`/api/vehicles/${updatedVehicle._id}`, updatedVehicle);
      const updated = res.data;

      setVehicles(prev =>
        prev.map(v => (v._id === updated._id ? updated : v))
      );

      setShowEditModal(false);
      toast.success("Vehicle updated successfully!");
    } catch (err) {
      toast.error("Failed to update vehicle: " + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div className="app-shell">
      <main className="app-container">
        <section className="page-header">
          <p className="eyebrow">JD Fleet Management</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="page-title">Fleet Overview</h1>
              <p className="page-description">Review active fleet assets, owners, categories, status, and service notes in one clean workspace.</p>
              <p className="mt-3 text-sm font-medium text-brand-slate">Welcome, {auth?.user?.username || "team member"}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button onClick={() => navigate("/vehicles/new")} className="btn-primary">Add Vehicle</button>
              <button onClick={() => navigate("/maintenance")} className="btn-success">Maintenance</button>
              <button onClick={() => navigate('/invoices')} className="btn-secondary">Reports</button>
            </div>
          </div>
        </section>

        {error && <div className="alert-error mb-4">{error.replace("❌ ", "")}</div>}

        {vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="text-3xl">🚘</div>
            <h2 className="mt-3 text-lg font-bold text-brand-deep">No vehicles yet</h2>
            <p className="mt-1">Add your first vehicle to start tracking ownership, maintenance, and invoices.</p>
            <button onClick={() => navigate("/vehicles/new")} className="btn-primary mt-5">Add Vehicle</button>
          </div>
        ) : (
          <ul className="grid gap-4">
            {vehicles.map((vehicle) => {
              const isOpen = expandedId === vehicle._id;
              const owner = vehicle.ownerId;
              const category = vehicle.categoryId;

              return (
                <li key={vehicle._id} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                  <button onClick={() => toggleExpand(vehicle._id)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-brand-soft sm:px-5">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-bold text-brand-deep">
                        <span>{isOpen ? "−" : "+"}</span>
                        <span>{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</span>
                      </div>
                      <p className="mt-1 text-sm text-brand-slate">{vehicle.plateNumber || "No plate"} • {category?.name || "Uncategorized"}</p>
                    </div>
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">{vehicle.status || "active"}</span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <Motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden border-t border-brand-border px-4 py-4 text-sm text-brand-slate sm:px-6">
                        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Info label="Label" value={vehicle.name || "—"} />
                          <Info label="Plate" value={vehicle.plateNumber} />
                          <Info label="Make" value={vehicle.brand} />
                          <Info label="Model" value={vehicle.model} />
                          <Info label="Year" value={vehicle.year} />
                          <Info label="Owner" value={`${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "—"} />
                          <Info label="Category" value={category?.name || "—"} />
                          <Info label="Date Added" value={vehicle.dateAdded ? new Date(vehicle.dateAdded).toLocaleDateString() : (vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : "—")} />
                        </dl>
                        <div className="mt-4 rounded-xl bg-brand-soft p-3"><span className="font-semibold text-brand-deep">Notes:</span> {vehicle.notes || "No notes recorded."}</div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button onClick={() => { setEditingVehicle(vehicle); setShowEditModal(true); }} className="btn-warning">Edit</button>
                          <button onClick={() => confirmDelete(vehicle)} className="btn-danger">Delete</button>
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}

        <EditVehicleModal visible={showEditModal} vehicle={editingVehicle} categories={categories} owners={owners} onClose={() => setShowEditModal(false)} onSave={handleUpdate} />
        <ConfirmModal visible={confirmVisible} title="Delete Vehicle" message={`Are you sure you want to delete ${vehicleToDelete?.brand} ${vehicleToDelete?.model}?`} onConfirm={handleConfirmDelete} onCancel={() => { setConfirmVisible(false); setVehicleToDelete(null); }} />
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-gold">{label}</dt><dd className="mt-1 font-medium text-brand-text">{value || "—"}</dd></div>;
}
