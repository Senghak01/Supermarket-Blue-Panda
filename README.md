# Supermarket System (ASP.NET Core API + Future Web Frontend)

Solution structure separated into `backend/` and `frontend/`:
- **`backend/`**: ASP.NET Core Web API with customer auth, catalog, cart, checkout, payments (Cash on Delivery, Sandbox, Bakong KHQR), security, and full **Management System** (Admin & Staff roles, Inventory & Stock Control, Order Management).
- **`frontend/`**: Web application placeholder (React / Vue / Angular).

---

## 1. Project Structure

```
Supermarket_API/
├── backend/
│   ├── Supermarket.sln
│   ├── Supermarket_API/         Controllers > Services > Data (EF Core MySQL)
│   │   ├── Controllers/         Customer, Staff, and Admin controllers
│   │   ├── Data/                DbContext, configurations, DevSeeder, Migrations
│   │   ├── DTOs/                Admin, Catalog, Cart, Order, Address, Inventory, Auth
│   │   ├── Models/              Customer, Role, CustomerRole, CustomerPermission, etc.
│   │   └── Services/            Admin, Staff, Order, Payment, Catalog, Token
│   ├── tests/
│   │   └── Supermarket.API.Tests/  Unit & integration tests using in-memory SQLite
│   ├── .gitignore
│   └── secrets.template.json
├── frontend/                    Web app placeholder
└── README.md
```

---

## 2. Prerequisites
- Visual Studio 2022 (with "ASP.NET and web development" workload) or VS Code.
- .NET 8 / 9 SDK.
- MySQL Server 8 (or XAMPP / MariaDB) running locally on port 3306.

---

## 3. Database Setup

1. In MySQL Workbench or CLI, create the database:
   ```sql
   CREATE DATABASE supermarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Open `backend/Supermarket.sln` in Visual Studio.
3. Right-click `Supermarket_API` > **Manage User Secrets** and configure your connection:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Port=3306;Database=supermarket_db;User=root;Password=YOUR_PASSWORD;"
     },
     "Jwt": {
       "Key": "A_VERY_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG"
     }
   }
   ```
4. In Visual Studio **Package Manager Console** (Default project: `Supermarket_API`):
   ```powershell
   Update-Database
   ```

---

## 4. Run & Test in Development

Press **F5** or run:
```bash
dotnet run --project backend/Supermarket_API/Supermarket_API.csproj
```
The browser opens Swagger at `https://localhost:7080/swagger`.

### Pre-Seeded Accounts (Development)
The API automatically seeds roles and default accounts if they do not exist:
| Role | Email | Password | Permissions | Notes |
|------|-------|----------|-------------|-------|
| **Admin** | `admin@supermarket.com` | `Admin@123` | Full Access | Complete store, user, stock, and order management |
| **Staff** | `staff@supermarket.com` | `Staff@123` | Read-only Catalog & Inventory | Default staff; can be promoted to stock control |

---

## 5. Management System Architecture

### Roles & Policies
1. **`Admin`** (`Policy = "AdminOnly"`):
   - User & staff management (create staff, change roles, grant/revoke permissions, activate/deactivate accounts).
   - Product & Category CRUD (create, update, delete).
   - Order management (view all store orders, filter by status, update status e.g. Preparing, ReadyForDelivery, Delivered, Cancelled).
   - Full inventory & stock control.

2. **`Staff`** (`Policy = "StaffOrAdmin"`):
   - Normal staff have default read-only access to browse products and check inventory levels.
   - Cannot adjust inventory quantities by default.

3. **Stock Control Promotion** (`Policy = "ManageStock"`):
   - Admin can promote any staff member to manage stock by granting the `"ManageStock"` permission.
   - Once granted, the staff member can call `POST /api/inventory/adjust` to add or deduct stock.
   - Admin accounts automatically satisfy the `ManageStock` policy.

---

## 6. Management API Endpoints

### Staff Endpoints
| Method | Route | Description | Required Authorization |
|--------|-------|-------------|------------------------|
| `GET` | `/api/staff/products` | Read-only product list & search | `Staff` or `Admin` |
| `GET` | `/api/staff/products/{id}` | Read-only product detail | `Staff` or `Admin` |
| `GET` | `/api/inventory` | View inventory stock levels (supports search, low-stock filter) | `Staff` or `Admin` |
| `GET` | `/api/inventory/{productId}` | View inventory for specific product | `Staff` or `Admin` |
| `GET` | `/api/inventory/movements` | View stock movement audit trail | `Staff` or `Admin` |
| `POST` | `/api/inventory/adjust` | Adjust stock quantity (`+` or `-`) with audit record | `Admin` OR Staff with `"ManageStock"` |

### Admin Endpoints
| Method | Route | Description | Required Authorization |
|--------|-------|-------------|------------------------|
| `GET` | `/api/admin/users` | List users with roles & permissions (paged/filtered) | `Admin` |
| `GET` | `/api/admin/users/{id}` | Get user details with roles & permissions | `Admin` |
| `POST` | `/api/admin/users` | Create a new staff or admin user | `Admin` |
| `PUT` | `/api/admin/users/{id}/roles` | Update user roles (e.g. `["Staff"]` or `["Admin"]`) | `Admin` |
| `POST` | `/api/admin/users/{id}/permissions` | Grant permission (e.g. `"ManageStock"` to promote staff) | `Admin` |
| `DELETE` | `/api/admin/users/{id}/permissions/{permission}` | Revoke permission | `Admin` |
| `PUT` | `/api/admin/users/{id}/status` | Activate or deactivate user account | `Admin` |
| `POST` | `/api/admin/products` | Create a product with initial inventory | `Admin` |
| `PUT` | `/api/admin/products/{id}` | Update product details | `Admin` |
| `DELETE` | `/api/admin/products/{id}` | Delete product (soft-deactivates if orders exist) | `Admin` |
| `POST` | `/api/admin/categories` | Create product category | `Admin` |
| `PUT` | `/api/admin/categories/{id}` | Update product category | `Admin` |
| `DELETE` | `/api/admin/categories/{id}` | Delete product category | `Admin` |
| `GET` | `/api/admin/orders` | View all customer orders (filter by status, search) | `Admin` |
| `GET` | `/api/admin/orders/{id}` | View full order detail | `Admin` |
| `PUT` | `/api/admin/orders/{id}/status` | Update order status (auto-restores stock on cancel) | `Admin` |

---

## 7. Automated Tests

All tests run against an in-memory SQLite database (no MySQL required):
```bash
dotnet test backend/tests/Supermarket.API.Tests/Supermarket.API.Tests.csproj
```
Tests verify:
- Auth, customer registration & JWT token generation with roles & permissions
- Stock control, inventory adjustment & movement audit logging
- Staff promotion to stock control via permission grant
- Cart calculations, checkout, order placement & stock deduction
- Order cancellation stock return
- Payment flows & sandbox confirmations

## Frontend Development Plan (React + Vite)

**Goal**: Build a complete web UI that covers the public shop experience, shopping‑cart flow, checkout, order history, and the full admin/staff management console.

### Stack Overview
- **Framework**: React with TypeScript (`npm create vite@latest frontend -- --template react-ts`)
- **UI Library**: Ant Design (or MUI as an alternative)
- **State Management**: Redux Toolkit + React‑Redux (or Zustand for a lighter option) 
- **Routing**: `react‑router‑dom` v6 with a `ProtectedRoute` component for role/permission guarding
- **HTTP**: Axios with interceptors (adds JWT, handles global errors)
- **Forms**: react‑hook‑form + Yup validation
- **Testing**: Jest + React Testing Library (unit) and Cypress (E2E)
- **Build / CI**: Vite (`npm run build`), GitHub Actions (install → lint → test → build)
- **Env**: `.env` (`VITE_API_URL`) for the backend base URL

### Folder Structure (`frontend/src`)
```
src/
 ├─ api/                # Axios instance & endpoint wrappers
 ├─ assets/             # Images, icons
 ├─ components/         # Re‑usable UI (Header, Footer, tables, modals)
 ├─ hooks/              # useAuth, useRoles, usePermission, useCart
 ├─ pages/              # Home, Login, Register, Catalog, ProductDetail, Cart, Checkout, Orders, AdminDashboard, StaffInventory
 ├─ routes/             # Route definitions + ProtectedRoute
 ├─ store/              # Redux slices (auth, catalog, cart, inventory, orders)
 ├─ utils/              # Helpers (formatters, constants)
 ├─ App.tsx
 └─ main.tsx
```

### Core Features
- **Authentication** (login/register, JWT storage, role/permission extraction) 
- **Public catalog** with pagination, filters, product detail, add‑to‑cart
- **Shopping cart** persisted in localStorage
- **Checkout** (shipping address, mock payment, order creation)
- **Order history** (user view, admin view with status updates)
- **Admin console** (user management, product/category CRUD, inventory adjustments)
- **Staff UI** (read‑only catalog, optional stock‑control when permission `ManageStock` is granted)

### API Wrapper (`src/api/index.ts`)
- Central Axios instance with request interceptor adding `Authorization: Bearer <jwt>`
- Exported functions: `login`, `register`, `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `placeOrder`, `getMyOrders`, `getAllOrders`, `getInventory`, `adjustStock`, `getUsers`, `updateUser`, …

### Routing & Guards (`src/routes/AppRouter.tsx`)
- Public routes: `/`, `/login`, `/register`, `/catalog`, `/products/:id`
- Authenticated routes: `/cart`, `/checkout`, `/orders`
- Admin routes (`/admin/*`) guarded by `requiredRole="Admin"`
- Staff routes (`/staff/inventory`) guarded by `requiredPerm="ManageStock"`

### State Management (Redux Toolkit example)
- **authSlice**: token, decoded user (`email`, `role`, `permissions`), login thunk
- **catalogSlice**, **cartSlice**, **inventorySlice**, **ordersSlice** – each with async thunks calling the API wrappers

### Testing Strategy
- **Unit**: Jest + React Testing Library for components, slices, utils
- **Integration**: MSW or mocked Axios for API layer
- **E2E**: Cypress scenarios covering login, role‑based UI visibility, product CRUD (admin), stock adjustment (staff with permission), checkout flow
- **CI**: GitHub Actions runs lint → test → build on every push

### CORS Note
Ensure the backend allows `http://localhost:5173` (Vite dev server) via a CORS policy in `Program.cs`.

### Quick‑Start
```bash
cd frontend
npm ci
cp .env.example .env   # adjust VITE_API_URL if needed
npm run dev            # http://localhost:5173
```

### Documentation
Add this section to the repository `README.md` so developers can instantly set up the frontend and understand the overall architecture.
