# Supermarket

An online supermarket: a customer shop with cart, checkout and Bakong KHQR payments, plus staff and admin tools for inventory, orders and people.

- **Backend:** ASP.NET Core 8 Web API, EF Core with MySQL, JWT auth
- **Frontend:** React 19, TypeScript, Vite, Ant Design, Redux Toolkit

## Features

**Customers**
- Register, log in, edit profile, manage delivery addresses
- Browse the catalog with search, aisle filter, sorting and in-stock filter
- Server-side cart with live stock checks
- Checkout, then pay with **Bakong KHQR** (QR code, automatic payment detection) or **cash on delivery**
- Order history, order tracking and cancellation of unpaid or unprocessed orders

**Staff**
- View stock levels and stock history
- Adjust stock when granted the `ManageStock` permission

**Admins**
- Manage products and aisles
- Move orders through their statuses
- Create staff accounts, assign roles and permissions, deactivate accounts

**Behind the scenes**
- Stock is reserved atomically when an order is placed and released when it is cancelled or expires
- Unpaid orders expire after 30 minutes (configurable)
- Rate limiting on login and register

## Project structure

```
Supermarket_API/
├── backend/
│   ├── Supermarket.sln
│   ├── Supermarket_API/            Web API
│   │   ├── Controllers/            Customer, staff and admin endpoints
│   │   ├── Services/               Business logic (orders, payments, stock, catalog, auth)
│   │   ├── Data/                   DbContext, DevSeeder
│   │   ├── Migrations/             EF Core migrations
│   │   ├── DTOs/ Models/
│   │   └── appsettings.json
│   ├── tests/Supermarket.API.Tests/  Unit and integration tests (in-memory SQLite)
│   └── secrets.template.json
├── frontend/
│   ├── src/
│   │   ├── api/                    Axios client and API wrappers
│   │   ├── components/             Layout, product card, payment panel, route guard
│   │   ├── hooks/ store/           Auth hook, Redux (auth and cart)
│   │   ├── pages/                  Shop, cart, checkout, orders, account, staff, admin
│   │   ├── routes/ types/ utils/
│   │   └── main.tsx
│   └── .env.example
└── README.md
```

## Prerequisites

- .NET 8 SDK
- MySQL 8 (or MariaDB) running on port 3306
- Node.js 20 or newer
- Visual Studio 2022 with the ASP.NET workload (or any editor and the .NET CLI)

## Getting started

### 1. Database

Create an empty database:

```sql
CREATE DATABASE supermarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

1. Open `backend/Supermarket.sln` in Visual Studio.
2. Right-click the `Supermarket_API` project, choose **Manage User Secrets**, and paste your own values. Use `backend/secrets.template.json` as a guide:

   ```json
   {
     "ConnectionStrings:DefaultConnection": "Server=localhost;Port=3306;Database=supermarket_db;User=root;Password=YOUR_MYSQL_PASSWORD;",
     "Jwt:Key": "a-long-random-string-of-at-least-32-characters",
     "Bakong:Token": ""
   }
   ```

   Secrets stay on your machine and are never committed.

3. Create the tables. In **Tools > NuGet Package Manager > Package Manager Console**, with the default project set to `Supermarket_API`:

   ```powershell
   Update-Database
   ```

4. Run the API with the **https** profile. It listens on `https://localhost:7080` and opens Swagger at `/swagger`.

In Development, `DevSeeder` creates the roles and two sample accounts the first time the API starts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@supermarket.com` | `Admin@123` |
| Staff | `staff@supermarket.com` | `Staff@123` |

These accounts exist only in Development. Never run a shared or public database in Development mode.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

In development the browser calls `/api` on the Vite server, and Vite forwards it to the API, so no CORS setup is needed. If you run only the http profile, set this in `frontend/.env`:

```
VITE_PROXY_TARGET=http://localhost:5080
```

Useful scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run lint` | Lint the source |
| `npm run preview` | Serve the production build locally |

## Configuration

Defaults live in `backend/Supermarket_API/appsettings.json`.

| Setting | Default | Meaning |
|---|---|---|
| `Jwt:ExpiryMinutes` | 60 | How long a login stays valid |
| `Delivery:FlatFee` | 1.50 | Delivery fee in USD |
| `Delivery:FreeDeliveryThreshold` | 20.00 | Subtotal above which delivery is free |
| `Payment:UnpaidOrderExpiryMinutes` | 30 | Unpaid orders are cancelled after this |
| `RateLimiting:AuthRequestsPerMinute` | 10 | Login and register attempts per IP per minute |
| `Bakong:Enabled` | false | Turns on KHQR payments |

### Bakong KHQR payments

KHQR is off by default, so only cash on delivery is offered. To turn it on:

1. Get a Bakong merchant account and an API token from the National Bank of Cambodia.
2. Put the token in user secrets as `Bakong:Token`.
3. In `appsettings.json` set `Bakong:Enabled` to `true` and fill in `AccountId` and `MerchantName`.

The API validates these settings at startup and refuses to start if KHQR is enabled but incomplete.

In Development a test **Card** method and a **Simulate payment** button are available so you can try the whole payment flow without a bank.

## Roles and permissions

| Role | Can do |
|---|---|
| Customer | Shop, cart, checkout, own orders, own addresses |
| Staff | Everything a customer can, plus view inventory and stock history |
| Admin | Everything, including products, aisles, orders, users |

Staff can change stock only if an admin grants them the `ManageStock` permission.

## API overview

All routes start with `/api`. Full details are in Swagger.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Catalog | `GET /products`, `GET /products/{id}`, `GET /categories` |
| Cart | `GET /cart`, `POST /cart/items`, `PUT` and `DELETE /cart/items/{id}`, `DELETE /cart` |
| Addresses | `GET` and `POST /addresses`, `PUT` and `DELETE /addresses/{id}`, `PUT /addresses/{id}/default` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel` |
| Payments | `POST` and `GET /orders/{id}/payments`, `POST /payments/{id}/check` |
| Staff | `GET /inventory`, `GET /inventory/movements`, `POST /inventory/adjust`, `GET /staff/products` |
| Admin | `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/users` |

## Tests

```bash
cd backend
dotnet test
```

## Deploying

- Set `ASPNETCORE_ENVIRONMENT=Production`. The sample accounts and the sandbox payment endpoint are then disabled.
- Provide `ConnectionStrings__DefaultConnection`, `Jwt__Key` and `Bakong__Token` as environment variables or from a secret store.
- Create the first admin account yourself, because production does not seed one.
- If the frontend is hosted on a different domain than the API, add a CORS policy for that origin in `Program.cs` and set `VITE_API_URL` to the full API URL before `npm run build`.
- If the API runs behind a reverse proxy, configure forwarded headers so rate limiting sees each visitor's real IP.

## Troubleshooting

**"An unexpected error occurred." on login or register.** The real cause is in the API console as an `Unhandled exception` entry with a stack trace. The usual causes are a missing table (run `Update-Database`) or a wrong connection string or `Jwt:Key` in user secrets.

**The frontend cannot reach the API.** Check the API is running and that `VITE_PROXY_TARGET` in `frontend/.env` matches the profile you started (7080 for https, 5080 for http). With the https profile, trust the dev certificate once: `dotnet dev-certs https --trust`.

**Only cash on delivery is offered.** KHQR is disabled. See the Bakong section above.

**Session ended unexpectedly.** Logins last 60 minutes. Log in again, or raise `Jwt:ExpiryMinutes`.

## Tech stack

ASP.NET Core 8, Entity Framework Core, Pomelo MySQL provider, BCrypt, JWT bearer auth, Swagger, React 19, TypeScript, Vite, Ant Design, Redux Toolkit, React Router, Axios, qrcode.react.

## License

Add your license here.