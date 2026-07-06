import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import toast from "react-hot-toast";

export default function EditMaintenance() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recordRes, vehiclesRes, partsRes] = await Promise.all([
                    axios.get(`/api/maintenance/${id}`),
                    axios.get("/api/vehicles"),
                    axios.get("/api/parts"),
                ]);

                const record = recordRes.data;
                setForm({
                    vehicleId: record.vehicleId?._id || "",
                    maintenanceType: record.maintenanceType || "",
                    serviceDate: record.serviceDate?.split("T")[0] || "",
                    status: record.status || "completed",
                    vendorName: record.vendorName || "",
                    nextServiceDate: record.nextServiceDate?.split("T")[0] || "",
                    odometerReading: record.odometerReading ?? "",
                    notes: record.notes || "",
                    services: record.services || [],
                    partsUsed: record.partsUsed?.map(p => p._id) || []
                });

                setVehicles(vehiclesRes.data);
                setAvailableParts(partsRes.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load maintenance record");
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePartsToggle = (partId) => {
        setForm(prev => {
            const exists = prev.partsUsed.includes(partId);
            const updated = exists
                ? prev.partsUsed.filter(id => id !== partId)
                : [...prev.partsUsed, partId];
            return { ...prev, partsUsed: updated };
        });
    };

    const addService = () => {
        setForm(prev => ({
            ...prev,
            services: [...prev.services, { description: "", cost: "" }]
        }));
    };

    const updateService = (index, field, value) => {
        const updated = [...form.services];
        updated[index][field] = field === "cost" ? parseInt(value) : value;
        setForm(prev => ({ ...prev, services: updated }));
    };

    const removeService = (index) => {
        const updated = form.services.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, services: updated }));
    };

    const handleSubmit = async () => {
        try {
            await axios.put(`/api/maintenance/${id}`, form);
            toast.success("Maintenance updated successfully");
            navigate("/maintenance");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update maintenance");
        }
    };

    const statusOptions = ["scheduled", "in progress", "completed", "cancelled"];

    if (!form) return <p className="p-6">Loading...</p>;

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">✏️ Edit Maintenance</h2>

            <select
                name="vehicleId"
                value={form.vehicleId}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-4"
            >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                        {v.brand} {v.model} ({v.plateNumber})
                    </option>
                ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                    name="maintenanceType"
                    value={form.maintenanceType || ""}
                    onChange={handleChange}
                    placeholder="Maintenance type"
                    className="w-full border p-2 rounded"
                />
                <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <label className="text-sm text-brand-slate">
                    Maintenance Date
                    <input
                        name="serviceDate"
                        type="date"
                        value={form.serviceDate || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded mt-1"
                    />
                </label>
                <label className="text-sm text-brand-slate">
                    Next Service Date
                    <input
                        name="nextServiceDate"
                        type="date"
                        value={form.nextServiceDate || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded mt-1"
                    />
                </label>
                <input
                    name="vendorName"
                    value={form.vendorName || ""}
                    onChange={handleChange}
                    placeholder="Vendor or mechanic"
                    className="w-full border p-2 rounded"
                />
                <input
                    name="odometerReading"
                    type="number"
                    min="0"
                    value={form.odometerReading}
                    onChange={handleChange}
                    placeholder="Mileage / odometer"
                    className="w-full border p-2 rounded"
                />
            </div>

            <textarea
                name="notes"
                value={form.notes || ""}
                onChange={handleChange}
                placeholder="Notes"
                className="w-full border p-2 rounded mb-4"
                rows="3"
            />

            <div className="mb-4">
                <h4 className="font-semibold mb-2">Services:</h4>
                {form.services.map((srv, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <input
                            value={srv.description || ""}
                            onChange={(e) => updateService(idx, "description", e.target.value)}
                            placeholder="Description"
                            className="flex-1 border p-2 rounded"
                        />
                        <input
                            type="number"
                            value={srv.cost || ""}
                            onChange={(e) => updateService(idx, "cost", e.target.value)}
                            placeholder="Cost"
                            className="w-24 border p-2 rounded"
                        />
                        <button onClick={() => removeService(idx)} className="text-red-600">🗑️</button>
                    </div>
                ))}
                <button onClick={addService} className="text-brand-navy hover:underline">+ Add Service</button>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold mb-2">Parts Used:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 border p-2 rounded">
                    {availableParts.map(part => (
                        <label key={part._id} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.partsUsed.includes(part._id)}
                                onChange={() => handlePartsToggle(part._id)}
                            />
                            {part.name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={() => navigate("/maintenance")} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                <button onClick={handleSubmit} className="bg-brand-navy text-white px-4 py-2 rounded hover:bg-brand-deep">Save</button>
            </div>
        </div>
    );
}
