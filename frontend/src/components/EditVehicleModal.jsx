import { useState, useEffect } from "react";

export default function EditVehicleModal({ visible, onClose, onSave, vehicle, categories, owners, staffMode = false }) {
    const [form, setForm] = useState({
        name: "",
        plateNumber: "",
        brand: "",
        model: "",
        year: "",
        categoryId: "",
        ownerId: "",
        status: "active",
        notes: ""
    });

    useEffect(() => {
        if (vehicle) {
            setForm({
                _id: vehicle._id,
                name: vehicle.name || "",
                plateNumber: vehicle.plateNumber || "",
                brand: vehicle.brand || "",
                model: vehicle.model || "",
                year: vehicle.year || "",
                categoryId: vehicle.categoryId?._id || "",
                ownerId: vehicle.ownerId?._id || "",
                status: vehicle.status || "active",
                notes: vehicle.notes || ""
            });
        }
    }, [vehicle]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (staffMode) {
            onSave({ _id: form._id, status: form.status, notes: form.notes });
            return;
        }
        onSave({ ...form, year: parseInt(form.year, 10) });
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto space-y-4">
                <h2 className="text-xl font-bold">{staffMode ? "Update Vehicle Status" : "Edit Vehicle"}</h2>
                {!staffMode && (
                    <>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Vehicle Name or Label" className="w-full border p-2 rounded" />
                        <input name="plateNumber" value={form.plateNumber} onChange={handleChange} placeholder="License Plate Number" className="w-full border p-2 rounded" />
                        <input name="brand" value={form.brand} onChange={handleChange} placeholder="Make" className="w-full border p-2 rounded" />
                        <input name="model" value={form.model} onChange={handleChange} placeholder="Model" className="w-full border p-2 rounded" />
                        <input name="year" value={form.year} onChange={handleChange} placeholder="Year" type="number" className="w-full border p-2 rounded" />
                    </>
                )}

                <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                </select>

                {!staffMode && (
                    <>
                        <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="">-- Select Category --</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>

                        <select name="ownerId" value={form.ownerId} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="">-- Select Owner --</option>
                            {owners.map(o => <option key={o._id} value={o._id}>{o.firstName} {o.lastName}</option>)}
                        </select>
                    </>
                )}

                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="w-full border p-2 rounded" rows="3" />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-brand-navy text-white rounded hover:bg-brand-deep">Save</button>
                </div>
            </div>
        </div>
    );
}
