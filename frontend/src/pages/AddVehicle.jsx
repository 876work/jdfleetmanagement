import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import { getApiErrorMessage } from "../utils/errorMessages";
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
      setMessage("Error: " + getApiErrorMessage(err, "Vehicle could not be saved. Please check the form and try again."));
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
      setMessage("Error: Failed to add category: " + (err.response?.data?.message || err.message));
    }
  };

  const addNewOwner = async (ownerData) => {
    try {
      const res = await axios.post("/api/customers", ownerData);
      const createdOwner = res.data;
      setOwners(prev => [...prev, createdOwner]);
      setFormData(prev => ({ ...prev, ownerId: createdOwner._id }));
      setShowOwnerModal(false);
    } catch (err) {
      const msg =
        err.response?.data?.message === "Email already exists."
          ? "❌ This email is already registered."
          : "❌ Failed to add owner: " + getApiErrorMessage(err, "Owner could not be saved. Please check the form and try again.");

      setMessage(msg.replace("❌ ", "Error: "));
    }
  };

  return (
    <div className="app-shell"><main className="app-container max-w-4xl"><section className="page-header"><p className="eyebrow">Fleet intake</p><h1 className="page-title">Add Fleet Vehicle</h1><p className="page-description">Capture vehicle details, ownership, category, and notes with a mobile-friendly form.</p></section><div className="card-pad">{message && <div className={message.startsWith("Error") ? "alert-error mb-4" : "alert-success mb-4"}>{message}</div>}<form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Vehicle Name or Label (e.g. Truck 12)" className="form-control" />
          <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} type="text" placeholder="License Plate Number" className="form-control" required />
          <input name="brand" value={formData.brand} onChange={handleChange} type="text" placeholder="Make" className="form-control" required />
          <input name="model" value={formData.model} onChange={handleChange} type="text" placeholder="Model" className="form-control" required />
          <input name="year" value={formData.year} onChange={handleChange} type="number" placeholder="Year (e.g. 2020)" className="form-control" required />
          <select name="status" value={formData.status} onChange={handleChange} className="form-control" required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <div>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="form-control" required>
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowCategoryModal(true)} className="btn-ghost mt-2 px-0">+ Add New Category</button>
          </div>
          <div>
            <select name="ownerId" value={formData.ownerId} onChange={handleChange} className="form-control" required>
              <option value="">-- Select Owner --</option>
              {owners.map(owner => (
                <option key={owner._id} value={owner._id}>{owner.firstName} {owner.lastName}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowOwnerModal(true)} className="btn-ghost mt-2 px-0">+ Add New Owner</button>
          </div>
          <div className="sm:col-span-2"><textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes (maintenance reminders, VIN, equipment, etc.)" className="form-control" rows="3" /></div>
          <button type="submit" className="btn-success sm:col-span-2">Submit</button>
        </form>
        <CategoryModal visible={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSave={addNewCategory} />
        <OwnerModal visible={showOwnerModal} onClose={() => setShowOwnerModal(false)} onSave={addNewOwner} existingOwners={owners} />
      </div></main></div>
  );
}
console.log("🚗 This is AddVehicle Page!");

