import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

export default function AddMaintenanceModal({ visible, onClose, onSave, vehicles }) {
    const defaultForm = {
        vehicleId: "",
        maintenanceType: "",
        serviceDate: new Date().toISOString().split("T")[0],
        status: "scheduled",
        vendorName: "",
        nextServiceDate: "",
        odometerReading: "",
        notes: "",
        services: [],
        partsUsed: []
    };

    const [form, setForm] = useState(defaultForm);
    const [availableParts, setAvailableParts] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const res = await axios.get("/api/parts");
                setAvailableParts(res.data);
            } catch (err) {
                console.error("❌ Failed to load parts:", err);
            }
        };
        fetchParts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const _handlePartsChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setForm(prev => ({ ...prev, partsUsed: selected }));
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
        if (!form.vehicleId || !form.serviceDate || form.services.length === 0) {
            console.log("📤 Data to submit:", form);
            setErrorMessage("Please select a vehicle, choose a date, and add at least one service.");
            return;
        }

        try {
            const res = await axios.post("/api/maintenance", form);
            onSave(res.data);
            setForm(defaultForm);
            onClose();
        } catch (err) {
            console.error("❌ Failed to submit:", err);
            setErrorMessage("Submission failed.");
        }
    };

    const handleCancel = () => {
        setForm(defaultForm);
        onClose();
    };

    const statusOptions = ["scheduled", "in progress", "completed", "cancelled"];

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-[500px] space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl text-center font-bold">➕ Add Maintenance</h2>

                {errorMessage && <div className="text-brand-error">{errorMessage}</div>}

                <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                            {v.brand} {v.model} ({v.plateNumber})
                        </option>
                    ))}
                </select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        name="maintenanceType"
                        value={form.maintenanceType}
                        onChange={handleChange}
                        placeholder="Maintenance type (e.g. Oil Change)"
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
                            value={form.serviceDate}
                            onChange={handleChange}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </label>
                    <label className="text-sm text-brand-slate">
                        Next Service Date
                        <input
                            name="nextServiceDate"
                            type="date"
                            value={form.nextServiceDate}
                            onChange={handleChange}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </label>
                    <input
                        name="vendorName"
                        value={form.vendorName}
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
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                    className="w-full border p-2 rounded"
                    rows="3"
                />

                {/* Services Section */}
                <div>
                    <h4 className="font-semibold mb-2">Services:</h4>
                    {form.services.map((srv, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <input
                                value={srv.description}
                                onChange={(e) => updateService(idx, "description", e.target.value)}
                                placeholder="Description"
                                className="flex-1 border p-2 rounded"
                            />
                            <input
                                type="number"
                                value={srv.cost}
                                onChange={(e) => updateService(idx, "cost", e.target.value)}
                                placeholder="Cost"
                                className="w-24 border p-2 rounded"
                            />
                            <button onClick={() => removeService(idx)} className="text-brand-error hover:text-red-800">🗑️</button>
                        </div>
                    ))}
                    <button onClick={addService} className="text-brand-navy hover:underline mt-1">+ Add Service</button>
                </div>

                {/* Parts Section */}
                <div>
                    <h4 className="font-semibold mb-2">Parts Used:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1 border p-2 rounded">
                        {availableParts.map(part => (
                            <label key={part._id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.partsUsed.includes(part._id)}
                                    onChange={() => {
                                        const exists = form.partsUsed.includes(part._id);
                                        const updated = exists
                                            ? form.partsUsed.filter(id => id !== part._id)
                                            : [...form.partsUsed, part._id];
                                        setForm(prev => ({ ...prev, partsUsed: updated }));
                                    }}
                                />
                                <span>{part.name}</span>
                            </label>
                        ))}
                    </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={handleCancel} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-brand-navy text-white rounded hover:bg-brand-deep">Save</button>
                </div>
            </div>
        </div>
    );
}
