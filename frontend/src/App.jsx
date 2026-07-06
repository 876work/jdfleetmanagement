import { Navigate, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import ProtectedRoute from "./components/ProtectedRoute";
import MaintenanceList from "./pages/MaintenanceList";
import InvoiceList from "./pages/invoices/InvoiceList";
import AddBill from "./pages/invoices/AddBill";
import EditBill from "./pages/invoices/EditBill";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import EditMaintenance from "./pages/EditMaintenance";
import ArchivedInvoices from "./pages/invoices/ArchivedInvoices";
import Dashboard from "./pages/Dashboard";
import AddPartOrder from "./pages/AddPartOrder";
import Register from "./pages/Register";
import Users from "./pages/Users";
import { useAuth } from "./context/useAuth";
import { isAdmin } from "./utils/permissions";

function App() {
  const { auth } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/signup" element={<Navigate to="/register" replace />} />

      <Route path="/sign-up" element={<Navigate to="/register" replace />} />

      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute>
            <AddVehicle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MaintenanceList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoiceList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/InvoicesPage"
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-bill"
        element={
          <ProtectedRoute>
            <AddBill />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-bill/:id"
        element={
          <ProtectedRoute>
            <EditBill />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-maintenance/:id"
        element={
          <ProtectedRoute>
            <EditMaintenance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/archived"
        element={
          <ProtectedRoute>
            <ArchivedInvoices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parts/:id/order"
        element={
          <ProtectedRoute>
            <AddPartOrder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            {isAdmin(auth) ? <Users /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;