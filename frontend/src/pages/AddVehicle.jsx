import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import CategoryModal from "../components/CategoryModal";
import OwnerModal from "../components/OwnerModal";

export default function AddVehicle() {
  const [formData, setFormData] = useState({
    name: "",
    plateNumber: "",
    brand: "",
    model: "",
    year: "",
    categoryId: "",
    ownerId: "",
    status: "active",
    notes: "",
  });

  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  useEffect(() => {
    axios.get("/api/categories").then(res => setCategories(res.data));
    axios.get("/api/customers").then(res => setOwners(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/vehicles", {
        ...formData,
        year: parseInt(formData.year, 10),
      });
      setMessage("Vehicle added successfully!");
      navigate("/vehicles");
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const addNewCategory = async (name) => {
    try {
      const res = await axios.post("/api/categories", { name });
      const createdCategory = res.data;
      setCategories(prev => [...prev, createdCategory]);
      setFormData(prev => ({ ...prev, categoryId: createdCategory._id }));
      setShowCategoryModal(false);
    } catch (err) {
      alert("Failed to add category: " + (err.response?.data?.message || err.message));
    }
  };

  const addNewOwner = async (ownerData) => {
    try {
      console.log("Sending owner data:", ownerData);
      const res = await axios.post("/api/customers", ownerData);
      const createdOwner = res.data;
      setOwners(prev => [...prev, createdOwner]);
      setFormData(prev => ({ ...prev, ownerId: createdOwner._id }));
      setShowOwnerModal(false);
    } catch (err) {
      const msg =
        err.response?.data?.message === "Email already exists"
          ? "❌ This email is already registered!"
          : "❌ Failed to add owner: " + (err.response?.data?.message || err.message);

      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft">
      <div className="max-w-xl w-full p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold text-center mb-4">🚗 Add Fleet Vehicle</h1>
        {message && <p className="mb-4 text-brand-navy">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
          <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Vehicle Name or Label (e.g. Truck 12)" className="w-full border px-3 py-2 rounded" />
          <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} type="text" placeholder="License Plate Number" className="w-full border px-3 py-2 rounded" required />
          <input name="brand" value={formData.brand} onChange={handleChange} type="text" placeholder="Make" className="w-full border px-3 py-2 rounded" required />
          <input name="model" value={formData.model} onChange={handleChange} type="text" placeholder="Model" className="w-full border px-3 py-2 rounded" required />
          <input name="year" value={formData.year} onChange={handleChange} type="number" placeholder="Year (e.g. 2020)" className="w-full border px-3 py-2 rounded" required />
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border px-3 py-2 rounded" required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <div>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full border px-3 py-2 rounded" required>
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowCategoryModal(true)} className="text-brand-navy underline text-sm mt-1">+ Add New Category</button>
          </div>
          <div>
            <select name="ownerId" value={formData.ownerId} onChange={handleChange} className="w-full border px-3 py-2 rounded" required>
              <option value="">-- Select Owner --</option>
              {owners.map(owner => (
                <option key={owner._id} value={owner._id}>{owner.firstName} {owner.lastName}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowOwnerModal(true)} className="text-brand-navy underline text-sm mt-1">+ Add New Owner</button>
          </div>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes (maintenance reminders, VIN, equipment, etc.)" className="w-full border px-3 py-2 rounded" rows="3" />
          <button type="submit" className="bg-brand-success text-white px-4 py-2 rounded hover:bg-brand-success">Submit</button>
        </form>
        <CategoryModal visible={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSave={addNewCategory} />
        <OwnerModal visible={showOwnerModal} onClose={() => setShowOwnerModal(false)} onSave={addNewOwner} existingOwners={owners} />
      </div>
    </div>
  );
}
console.log("🚗 This is AddVehicle Page!");

