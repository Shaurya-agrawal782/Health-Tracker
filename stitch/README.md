# VitalIQ Health

Your daily wellness companion for food, sleep, stress, and habits.

VitalIQ Health is an AI-assisted wellness platform that helps users understand lifestyle patterns, get budget-friendly meal plans, follow daily wellness actions, and track progress over time — without needing medical reports, lab tests, or clinical knowledge.

VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.

## 🚀 Key Features

### 🛡️ Authentication & Access
*   **Google Sign-In Demo Flow**: OAuth-ready frontend demo for local development; production Google sign-in should verify Google-issued ID tokens on the backend before being enabled.
*   **Two-Step OTP Verification**: Real-world security using **Nodemailer**. Users receive unique 6-digit codes in their Gmail for both login and registration.
*   **Guest Access**: Explore the full platform without an account using the dedicated "Guest Mode".

### 🧘 Wellness Check
*   **AI-Assisted Screening**: Estimates wellness signals from lifestyle metrics — no medical reports needed.
*   **Simple Lifestyle Inputs**: Age, gender, sleep, stress, activity, diet, and optional health metrics.
*   **Instant Risk Estimate**: Categorized as Low / Moderate / Elevated wellness risk with plain-language explanations.

### 🍱 Budget-Friendly Meal Planner
*   **Budget-Based Meal Plans**: Choose Low / Medium / High budget (or custom ₹ amount) and get realistic Indian meal suggestions.
*   **Food Preference Support**: Vegetarian, Non-vegetarian, Eggetarian, and Vegan options.
*   **User Type Aware**: Plans tailored for Students, Working Professionals, Fitness-focused, or General Wellness users.

### 📋 Daily Actions & Recommendations
*   **Context-Aware Actions**: Daily wellness steps that adapt to your latest screening results.
*   **Affordable Swaps**: Practical food and habit substitutions based on your budget and lifestyle.

### 🗺️ Environmental Wellness Map
*   **Live Map**: Interactive Leaflet-based map with regional AQI, UV, and Humidity metrics.
*   **Smart Geolocation**: Auto-centers on the user with pulsing location markers.

### 📊 Progress & Streaks
*   **Wellness Streaks**: Earn wellness points for consistent daily logging with privacy-safe community display.
*   **Progress History**: View past wellness checks and track improvements over time.

---

## 📚 Documentation
For detailed developer instructions, see our component READMEs:
- [Frontend Documentation](./frontend/README.md)
- [Backend API Documentation](./backend/README.md)

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, CSS Variables (custom design system), Leaflet.js, React Icons.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Nodemailer.
- **AI**: Google Gemini API with configurable model selection.
- **Auth**: Google OAuth-ready demo, OTP-based email verification.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (optional, for the local Google sign-in demo)
- Gmail App Password (for OTPs)

### 2. Environment Variables

Each sub-project ships with a `.env.example` file listing every variable the app reads. Copy it to `.env` and fill in your real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`. `.env.example` files are safe to commit — they contain only placeholder values.

#### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens |
| `JWT_EXPIRE` | No | Token expiry (default: `7d`) |
| `FRONTEND_URL` | **Yes (prod)** | Frontend origin for CORS |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio API key |
| `GEMINI_MODEL` | No | Gemini model (default: `gemini-2.5-flash`) |
| `EMAIL_USER` | **Yes** | Gmail address for OTP emails |
| `EMAIL_PASS` | **Yes** | Gmail App Password (16 chars) |
| `ML_API_URL` | No | External ML service URL (default: `http://localhost:8000`) |

#### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Full backend API base URL |

### 3. Run Locally
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 4. Render Deployment Environment

For a Render frontend static site, set:
```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

For the Render backend service, set:
```env
FRONTEND_URL=https://your-frontend-service.onrender.com
```

Do not leave `VITE_API_URL` blank in production. Without it, the static frontend cannot reliably know where the backend API lives.

---

## 🎨 Visual Identity
VitalIQ Health uses a curated **Emerald & Slate** design system with CSS custom properties, **Glassmorphism** panels, and **Dynamic Micro-animations** to create a polished, trustworthy wellness experience.

---

## 🎉 Recent Updates
- **Budget-Based Meal Planner**: AI-generated meal plans matching Low / Medium / High budgets with Indian food options.
- **Product-Style Navigation**: Updated to Dashboard, Wellness Check, Meal Planner, Daily Actions, Habits, Progress, Wellness Streaks, Privacy.
- **Habits & Privacy Pages**: New placeholder pages for upcoming Habit Tracking and a clear Privacy & Data Safety disclosure.
- **Guest Mode**: Guest wellness checks are displayed instantly but not saved to MongoDB.
- **Wellness Streaks**: Community leaderboard with anonymized names — no personal health data is ever shown.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026 VitalIQ Health. AI-Assisted Wellness Platform.
