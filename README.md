# 🚗 Vehicle Management System (VMS)

A full-stack application to manage vehicles, owners, maintenance records, invoices, and categories — built with Node.js, MongoDB, and React.

---

## 📦 Features

- Add / Edit / Delete Vehicles
- Categorize vehicles (e.g., car, motorcycle, truck)
- Manage Owners / Customers
- Record maintenance and service history
- **Invoice Management (Bills)** with service items and total price calculation
- Login / Authentication with JWT
- Store and retrieve data via MongoDB
- Protected frontend routes
- Clean and responsive UI with TailwindCSS
- Archive and restore invoices (soft delete)
- Dashboard with recent maintenances and invoices
- **Unit & Integration Tests** for backend using Jest and Supertest
- **In-memory test database** with `mongodb-memory-server`
- **CI pipeline with GitHub Actions**

---

## 🛠 Tech Stack

- **Frontend**: React + Vite + TailwindCSS + React Hook Form
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Auth**: JWT
- **Data Storage**: MongoDB Atlas / local MongoDB
- **Testing**: Jest, Supertest, mongodb-memory-server
- **CI/CD**: GitHub Actions
- **Other Tools**: Axios, React Router, dotenv, nodemon, Postman, Git

---

## 📁 Folder Structure

```bash
VMS/
│
├── frontend/             # React frontend
│   └── src/pages         # Login, Vehicles, Maintenance, Invoices
│   └── src/components    # UI components (Form, Modal, Table)
│
├── backend/              # Express backend
│   └── models            # Mongoose schemas
│   └── controllers       # Logic for each route
│   └── routes            # REST API endpoints
│   └── tests             # Backend test cases (Jest + Supertest)
│
├── .github/workflows     # CI config (GitHub Actions)
├── seed.js               # Initial data for DB
└── .gitignore
```

---

## ▶️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/fatemeGheysari/vms-project.git
cd vms-project
```

### 2. Setup backend

```bash
cd backend
npm install
node index.js
```

### 3. Setup frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Create `.env` file in `/backend`

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## ✅ Running Tests

🧪 Backend tests (Jest + Supertest + mongodb-memory-server)

```bash
cd backend
npm test
```

> All test suites run against a fast in-memory MongoDB instance (no real data affected).

---

## 🔁 CI (Continuous Integration)

GitHub Actions runs lint and test jobs automatically on every push or pull request to `main`.
Check `.github/workflows/ci.yml` for details.

---

## 💡 Author

**Fatemeh Gheysari**
[GitHub Profile](https://github.com/fatemeGheysari)
[LinkedIn Profile](https://linkedin.com/in/fatemeh-gheysari)

---

## ✅ To Do / In Progress

- [x] Implement Invoice (Bill) CRUD
- [x] Total price calculation from services
- [x] Filter invoices by customer/vehicle
- [x] Protect routes with JWT middleware
- [x] Add Delete & Edit functionality to invoices
- [x] Backend test coverage
- [x] CI with GitHub Actions
- [x] Print invoice as PDF
- [x] Add invoice archive functionality and archived bills page
- [x] Create dashboard with recent maintenances and invoices section
- [ ] Optional: Pagination & search


### 📌 Next Feature Ideas

1. **Reports & Analytics**
   - Create a Reports page in the frontend
   - Show monthly revenue (from invoices) with a chart
   - Display number of maintenances/services in a selectable time range
   - Identify most used parts from `partsUsed`
   - Implement backend APIs for aggregated statistical data

2. **Inventory Management for Parts**
   - Add `stock` field to the `Part` model
   - Reduce stock when a part is used in a maintenance record
   - Show low-stock warnings on the dashboard
   - API to update stock and record new part orders
   - Part order button
   - Display a list of orders placed for a specific item

3. **Booking & Appointment System**
   - Create a new `Booking` model with customer, vehicle, date, and description
   - Allow customers to create bookings via the UI
   - Allow admin to approve, reject, or mark bookings as completed
   - Filter and display bookings by status (pending, approved, completed)

---

## Production readiness and deployment

### Required environment variables

#### Frontend (`frontend/.env` locally, Netlify environment variables in production)

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

- `VITE_API_BASE_URL` must be the full HTTPS origin for the backend API and must not end with `/api`. The frontend calls routes such as `/api/auth/login` through the shared Axios client.
- For local development, use `VITE_API_BASE_URL=http://localhost:3000` when the backend is running on port `3000`.

#### Backend (`backend/.env` locally, Render environment variables in production)

```env
PORT=3000
MONGO_URI=mongodb+srv://<db-user>:<db-password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://your-netlify-site.netlify.app
SEED_ADMIN_USERNAME=<admin-username>
SEED_ADMIN_EMAIL=<admin-email>
SEED_ADMIN_PASSWORD=<temporary-admin-password>
```

- `MONGO_URI` and `JWT_SECRET` are required for backend startup.
- `PORT` is optional locally because the backend defaults to `3000`; Render injects `PORT` automatically.
- `CLIENT_URL` is required in production unless the frontend is deployed at `https://jdfleetmanagement.netlify.app`, which is already allowed by the backend CORS policy. Use a comma-separated list if more than one frontend origin should be allowed.
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` are required only when running the admin seed script.

### Netlify frontend settings

Set the Netlify site to deploy from the `frontend` folder:

| Setting | Value |
| --- | --- |
| Base directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `frontend/dist` |
| Environment variable | `VITE_API_BASE_URL=https://your-render-service.onrender.com` |

React Router refresh support is handled by `frontend/public/_redirects`, which rewrites all frontend routes to `/index.html`.

### Render backend settings

Create a Render Web Service for the backend:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Runtime | `Node` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/health` |
| Environment variables | `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` |

Use `https://your-render-service.onrender.com` as the value of `VITE_API_BASE_URL` in Netlify. Use the Netlify site origin, for example `https://your-netlify-site.netlify.app`, as the value of `CLIENT_URL` in Render.

### MongoDB Atlas setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access to the application database.
3. Add Render outbound access in **Network Access**. For the simplest Render setup, allow access from anywhere (`0.0.0.0/0`) or use your organization's approved static egress option if available.
4. Copy the Atlas connection string and set it as `MONGO_URI` in Render. Include the database name in the path portion of the URI.
5. Keep the Atlas username and password out of Git. Store them only in local `.env` files and deployment provider environment variables.

### Admin seed workflow

After the backend environment is configured, create or update the first admin user from the backend folder:

```bash
cd backend
MONGO_URI="mongodb+srv://..." \
SEED_ADMIN_USERNAME="admin" \
SEED_ADMIN_EMAIL="admin@example.com" \
SEED_ADMIN_PASSWORD="change-this-password" \
npm run seed:admin
```

The seed script hashes the password through the `User` model before saving it. Change the temporary password after first login.

### Local production-readiness checks

Run these commands before deploying:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:3000 npm run build
npm test -- --run

cd ../backend
npm ci
npm test -- --runInBand
MONGO_URI="mongodb+srv://..." JWT_SECRET="local-long-random-secret" npm start
```

Then open the frontend locally, log in with the seeded admin account, and verify the dashboard, vehicles, maintenance, invoices, users, and parts order pages against the backend API.
