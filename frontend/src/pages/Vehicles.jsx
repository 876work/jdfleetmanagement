import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { isAdmin } from "../utils/permissions";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

  const navigate = useNavigate();
  const { auth } = useAuth();
  const admin = isAdmin(auth);

  const fetchAll = async () => {
    try {
      const [vehiclesRes, categoriesRes, ownersRes] = await Promise.all([
        axios.get("/api/vehicles"),
        axios.get("/api/categories"),
        axios.get("/api/customers"),
      ]);

      setVehicles(vehiclesRes.data);
      setCategories(categoriesRes.data);
      setOwners(ownersRes.data);
    } catch (err) {
      setError(
        "Error fetching data: " + (err.response?.data?.message || err.message)
      );
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete?._id) {
      toast.error("No vehicle selected");
      return;
    }

    try {
      await axios.delete(`/api/vehicles/${vehicleToDelete._id}`);

      setVehicles((prev) =>
        prev.filter((vehicle) => vehicle._id !== vehicleToDelete._id)
      );

      setConfirmVisible(false);
      setVehicleToDelete(null);
      toast.success("Vehicle deleted successfully!");
    } catch (err) {
      toast.error(
        "Failed to delete vehicle: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleUpdate = async (updatedVehicle) => {
    try {
      const res = await axios.put(
        `/api/vehicles/${updatedVehicle._id}`,
        updatedVehicle
      );

      const updated = res.data;

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle._id === updated._id ? updated : vehicle
        )
      );

      setShowEditModal(false);
      setEditingVehicle(null);
      toast.success("Vehicle updated successfully!");
    } catch (err) {
      toast.error(
        "Failed to update vehicle: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const statusOptions = useMemo(() => {
    return [
      ...new Set(
        vehicles
          .map((vehicle) => (vehicle.status || "active").trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const ownerName = [
        vehicle.ownerId?.firstName,
        vehicle.ownerId?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const vehicleStatus = (vehicle.status || "active").trim();

      const searchableText = [
        vehicle.name,
        vehicle.plateNumber,
        vehicle.brand,
        vehicle.model,
        ownerName,
        vehicle.categoryId?.name,
        vehicleStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = term ? searchableText.includes(term) : true;
      const matchesStatus = statusFilter ? vehicleStatus === statusFilter : true;
      const matchesOwner = ownerFilter
        ? vehicle.ownerId?._id === ownerFilter
        : true;

      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [vehicles, searchTerm, statusFilter, ownerFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setOwnerFilter("");
  };

  return (
    <div className="app-shell">
      <main className="app-container">
        <section className="page-header">
          <p className="eyebrow">JD Fleet Management</p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="page-title">Fleet Overview</h1>

              <p className="page-description">
                Review active fleet assets, owners, categories, status, and
                service notes in one clean workspace.
              </p>

              <p className="mt-3 text-sm font-medium text-brand-slate">
                Welcome, {auth?.user?.username || "team member"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={() => navigate("/vehicles/new")}
                className="btn-primary"
              >
                Add Vehicle
              </button>

              <button
                onClick={() => navigate("/maintenance")}
                className="btn-success"
              >
                Maintenance
              </button>

              <button
                onClick={() => navigate("/invoices")}
                className="btn-secondary"
              >
                Reports
              </button>
            </div>
          </div>
        </section>

        {error && <div className="alert-error mb-4">{error}</div>}

        {vehicles.length > 0 && (
          <section className="mb-6 rounded-xl border border-brand-border bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search vehicle, plate, owner..."
                className="w-full rounded border border-brand-border p-2"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded border border-brand-border p-2"
              >
                <option value="">All Statuses</option>

                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                className="w-full rounded border border-brand-border p-2"
              >
                <option value="">All Owners</option>

                {owners.map((owner) => (
                  <option key={owner._id} value={owner._id}>
                    {owner.firstName} {owner.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-brand-slate">
              <span>
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
              </span>

              <button
                type="button"
                onClick={resetFilters}
                className="text-brand-navy hover:underline"
              >
                Reset filters
              </button>
            </div>
          </section>
        )}

        {vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="text-3xl">🚘</div>

            <h2 className="mt-3 text-lg font-bold text-brand-deep">
              No vehicles yet
            </h2>

            <p className="mt-1">
              Add your first vehicle to start tracking ownership, maintenance,
              and invoices.
            </p>

            <button
              onClick={() => navigate("/vehicles/new")}
              className="btn-primary mt-5"
            >
              Add Vehicle
            </button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="text-3xl">🔎</div>

            <h2 className="mt-3 text-lg font-bold text-brand-deep">
              No matching vehicles
            </h2>

            <p className="mt-1">
              Adjust your search or filters to find the vehicle you need.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-primary mt-5"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="grid gap-4">
            {filteredVehicles.map((vehicle) => {
              const isOpen = expandedId === vehicle._id;
              const owner = vehicle.ownerId;
              const category = vehicle.categoryId;
              const vehicleStatus = vehicle.status || "active";
              const vehicleName =
                vehicle.name ||
                `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() ||
                "Unnamed vehicle";

              return (
                <li
                  key={vehicle._id}
                  className="card overflow-hidden transition hover:shadow-md"
                >
                  <button
                    onClick={() => toggleExpand(vehicle._id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-brand-soft sm:px-5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-lg font-bold text-brand-deep">
                        <span>{isOpen ? "−" : "+"}</span>
                        <span>{vehicleName}</span>
                      </div>

                      <p className="mt-1 text-sm text-brand-slate">
                        {vehicle.plateNumber || "No plate"} •{" "}
                        {category?.name || "Uncategorized"}
                      </p>
                    </div>

                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
                      {vehicleStatus}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <Motion.div
                        key={`vehicle-details-${vehicle._id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-brand-border px-4 py-4 text-sm text-brand-slate sm:px-6"
                      >
                        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Info label="Label" value={vehicle.name || "—"} />
                          <Info label="Plate" value={vehicle.plateNumber} />
                          <Info label="Make" value={vehicle.brand} />
                          <Info label="Model" value={vehicle.model} />
                          <Info label="Year" value={vehicle.year} />
                          <Info label="Status" value={vehicleStatus} />
                          <Info
                            label="Owner"
                            value={
                              `${owner?.firstName || ""} ${
                                owner?.lastName || ""
                              }`.trim() || "—"
                            }
                          />
                          <Info
                            label="Category"
                            value={category?.name || "—"}
                          />
                          <Info
                            label="Date Added"
                            value={
                              vehicle.dateAdded
                                ? new Date(vehicle.dateAdded).toLocaleDateString()
                                : vehicle.createdAt
                                ? new Date(vehicle.createdAt).toLocaleDateString()
                                : "—"
                            }
                          />
                        </dl>

                        <div className="mt-4 rounded-xl bg-brand-soft p-3">
                          <span className="font-semibold text-brand-deep">
                            Notes:
                          </span>{" "}
                          {vehicle.notes || "No notes recorded."}
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setShowEditModal(true);
                            }}
                            className="btn-warning"
                          >
                            Edit
                          </button>

                          {admin && (
                            <button
                              onClick={() => confirmDelete(vehicle)}
                              className="btn-danger"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}

        <EditVehicleModal
          visible={showEditModal}
          vehicle={editingVehicle}
          categories={categories}
          owners={owners}
          onClose={() => {
            setShowEditModal(false);
            setEditingVehicle(null);
          }}
          staffMode={!admin}
          onSave={handleUpdate}
        />

        <ConfirmModal
          visible={confirmVisible}
          title="Delete Vehicle"
          message={`Are you sure you want to delete ${
            vehicleToDelete?.brand || "this"
          } ${vehicleToDelete?.model || "vehicle"}?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setConfirmVisible(false);
            setVehicleToDelete(null);
          }}
        />
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-brand-gold">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-brand-text">{value || "—"}</dd>
    </div>
  );
}