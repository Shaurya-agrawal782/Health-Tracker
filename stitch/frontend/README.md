# VitalIQ Health — Frontend

VitalIQ Health is the React frontend for an AI-assisted wellness risk-screening platform. It helps users enter lifestyle and health metrics, view wellness risk estimates, receive personalized recommendations, and track progress through a clean dashboard experience.

> **Medical Disclaimer:** VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, always consult a qualified healthcare professional.

---

## Live Demo

**Frontend:** [https://stitch-frontend-l4rq.onrender.com](https://stitch-frontend-l4rq.onrender.com)

---

## Key Features

- **Guest Access** — Explore the platform instantly without creating an account
- **OTP-Based Authentication** — Secure email OTP flow for login and registration
- **Google OAuth Sign-In** — One-click Google sign-in integration
- **AI-Assisted Wellness Screening** — Multi-step health check form with ML-backed risk assessment
- **Risk Result Dashboard** — Visual risk scores, insights, and categorized health flags
- **Personalized Wellness Recommendations** — Tailored lifestyle guidance based on screening results
- **Wellness History** — Browse and review past health check submissions
- **Wellness Streaks** — Privacy-safe streak tracking to encourage consistent check-ins
- **Meal Planner** — Suggested meal plans aligned with wellness goals
- **Leaderboard** — Anonymous wellness leaderboard to motivate healthy habits
- **Interactive Health Map** — Location-aware map for contextual wellness data (Leaflet)
- **Centralized API Service** — Axios instance with Bearer token support and session-expired UX
- **Responsive UI** — Works cleanly on desktop and mobile

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI component framework |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client with request/response interceptors |
| [Recharts](https://recharts.org/) | Dashboard charts (activity, sleep, calories, health trends) |
| [React Leaflet](https://react-leaflet.js.org/) + [Leaflet](https://leafletjs.com/) | Interactive health map |
| [React Icons](https://react-icons.github.io/react-icons/) | Icon library (Feather, etc.) |
| [React Hot Toast](https://react-hot-toast.com/) | Toast notifications |
| [@react-oauth/google](https://github.com/MomenSherif/react-oauth-google) | Google OAuth integration |

---

## Folder Structure

```
frontend/
└── src/
    ├── assets/          # Static assets (images, SVGs, fonts)
    ├── components/
    │   ├── auth/        # OTP verification and auth-related components
    │   ├── common/      # Shared components (ErrorBoundary, AIAssistant, etc.)
    │   ├── dashboard/   # Dashboard widgets (charts, health map, emergency locator)
    │   └── layout/      # App shell components (DashboardLayout, Navbar, Sidebar)
    ├── context/
    │   └── AuthContext.jsx   # Global auth state, login/logout, guest access
    ├── pages/           # Route-level page components
    │   ├── Landing.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── ForgotPassword.jsx
    │   ├── Dashboard.jsx
    │   ├── HealthCheckForm.jsx
    │   ├── AnalyzingResults.jsx
    │   ├── HealthResults.jsx
    │   ├── HealthInput.jsx
    │   ├── Insights.jsx
    │   ├── MedicalHistory.jsx
    │   ├── Recommendations.jsx
    │   ├── MealPlanner.jsx
    │   ├── Leaderboard.jsx
    │   └── NotFound.jsx
    ├── services/
    │   └── api.js       # Axios instance, interceptors, and all API call definitions
    ├── App.jsx          # Root component with routing and auth event listener
    ├── main.jsx         # React entry point
    └── index.css        # Global styles and Tailwind base
```

---

## Environment Variables

Copy the example file and fill in your real values — **never commit `.env`**:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Full base URL of the backend API (no trailing slash) |

**Local development:**
```env
VITE_API_URL=http://localhost:5000/api
```

**Production (Render, etc.):**
```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

> See [`frontend/.env.example`](./.env.example) for a fully-commented template.
> ⚠️ All Vite env variables must be prefixed with `VITE_` to be accessible in the browser.

---

## Run Locally

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173 by default)
npm run dev
```

---

## Build

```bash
# Create an optimised production build in /dist
npm run build

# Preview the production build locally
npm run preview
```

---

## Deployment Notes

### Render — Static Site

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

**Environment variable to set in Render dashboard:**
```
VITE_API_URL=https://your-backend-service.onrender.com/api
```

> The backend Render service should also set `FRONTEND_URL=https://your-frontend-service.onrender.com` to allow CORS requests from the static site.

---

## Auth Architecture Notes

- Auth state is managed via `AuthContext` (`src/context/AuthContext.jsx`).
- All API calls attach a Bearer token via an Axios request interceptor.
- On a `401 Unauthorized` API response, the API layer dispatches a `auth:unauthorized` custom browser event — it does **not** call `window.location.href` directly.
- An `AuthEventListener` component (mounted inside `App.jsx`) listens for this event and uses React Router's `useNavigate` for a clean, full-page-reload-free redirect to `/login`, displaying a *"Your session expired. Please sign in again."* toast.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build optimised production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on the source files |
