## Finance Recorder — AI assistant instructions

This repo contains a small MERN-style app split into two folders: `Backend/` (Express + Mongoose) and `Frontend/finance_Recorder` (Vite + React).

Keep responses focused, actionable, and tied to the files below. Prefer minimal, testable code changes and include exact file paths when modifying code.

Key architecture notes
- Backend is an Express API (ES modules). Entry: `Backend/index.js` which mounts three route groups:
  - `/api/users` — auth (register/login) via `Backend/Routes/userRoutes.js`
  - `/api/userdata` — user limits & balances via `Backend/Routes/userDataRoutes.js`
  - `/api/transactions` — create/update/list transactions via `Backend/Routes/transactionRoutes.js`
- Mongo connection: `Backend/connection/Connection.js` (reads `process.env.MONGO_URI`). Models live in `Backend/Models/*.js` (User, Transaction, UserData).
- Auth: JWT-based. Middleware `Backend/middleware/authMiddleware.js` expects Authorization: `Bearer <token>` and attaches `req.user = { userId }`.

Frontend notes
- React (Vite) app root: `Frontend/finance_Recorder/src`.
- API client: `src/api/axiosInstance.js` — baseURL points to `http://localhost:5000` and automatically attaches token from `localStorage` to Authorization header.
- Auth context: `src/context/AuthContext.jsx` stores token in `localStorage` and exposes `login(token,userId)`, `logout()`, and `useAuth()` hook. It expects a backend verification endpoint at `/api/auth/verify` that returns `{ userId }`.

Important patterns and expectations (use these exactly)
- JWT shape: signed payload contains `{ userId }`. See `Backend/Routes/userRoutes.js` where token is created using `jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
- Transactions: controller expects `type` in `['credit','debit','withdrawal']` and `amount` is numeric. Files: `Backend/controllers/transactionController.js`, `Backend/Models/Transactions.js`.
- UserData: controllers update `totalCredit`/`totalDebit` after transactions. See `Backend/controllers/userDataController.js` and `Backend/Models/UserData.js`.

Developer workflows / commands
- Backend (run from `Backend/`):
  - Start production: `npm start` (runs `node index.js`)
  - Dev (auto-reload): `npm run Dev` — uses `nodemon index.js`
  - Requires environment variables: `MONGO_URI` and `JWT_SECRET` (set in `.env` at repo or process environment).
- Frontend (run from `Frontend/finance_Recorder`):
  - Dev server: `npm run dev` (Vite)
  - Build: `npm run build`
  - Preview build: `npm run preview`

Files to reference for edits and examples
- Backend: `index.js`, `connection/Connection.js`, `middleware/authMiddleware.js`, `controllers/*.js`, `Routes/*.js`, `Models/*.js`.
- Frontend: `src/api/axiosInstance.js`, `src/context/AuthContext.jsx`, pages under `src/pages/`.

When making changes, follow these concrete rules
- Use ES module syntax (import/export) in backend files — the project `package.json` sets `type: 'module'`.
- When adding or changing routes, update both the router in `Backend/Routes` and relevant controller in `Backend/controllers`. Keep auth middleware on protected routes.
- For requests from the frontend, rely on `axiosInstance` and the token stored in `localStorage` — do not introduce alternate global fetch wrappers without updating `axiosInstance`.
- Keep DB field names and types consistent with models (e.g., `amount: Number`, `userId: ObjectId`).

Examples (copyable)
- Auth header format: Authorization: `Bearer <token>` (used by `authMiddleware.js`).
- Add a transaction request (frontend):
  - Endpoint: `POST http://localhost:5000/api/transactions` (protected)
  - Body JSON: { "type":"debit", "method":"Card", "category":"Groceries", "amount": 34.5, "description":"Weekly shop" }

Testing and verification tips
- Quick backend smoke test: curl or Postman to `GET http://localhost:5000/` should return the running message.
- To verify token flow: register via `/api/users/register`, login `/api/users/login` to get token, then call a protected endpoint (e.g., `GET /api/transactions`) using `Authorization: Bearer <token>`.

What not to change without asking
- Do not alter token payload shape (must include `userId`) or endpoint paths (e.g., `/api/users`, `/api/transactions`, `/api/userdata`) without confirmation.
- Avoid changing `axiosInstance.baseURL` without updating developer docs — many frontend files use relative paths through this instance.

If something's missing or unclear
- Ask for these before proceeding with larger changes: sample `.env` values (MONGO_URI, JWT_SECRET), intended CORS/hosting config, any auth/roles beyond a single userId.

If you modify code, run basic checks
- Backend: run `npm run Dev` and watch for connection/log output. Ensure `MongoDB Connected` prints when `MONGO_URI` is valid.
- Frontend: run `npm run dev` and ensure the Vite dev server starts and the app connects to backend endpoints.

Finished — please review these instructions and tell me if you'd like more detail about tests, CI, or deployment steps.
