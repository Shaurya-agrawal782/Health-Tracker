# VitalIQ Health

AI-Assisted Wellness Risk Screening Platform

VitalIQ Health is an AI-assisted wellness risk-screening platform that helps users track lifestyle metrics, estimate wellness risk levels, and receive personalized wellness recommendations using React, Node.js, Express, MongoDB, and Gemini API.

VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.

## 🚀 Key Features

### 🛡️ Advanced Authentication Suite
*   **Google Sign-In Demo Flow**: OAuth-ready frontend demo for local development; production Google sign-in should verify Google-issued ID tokens on the backend before being enabled.
*   **Two-Step Verification**: Real-world security using **Nodemailer**. Users receive unique 6-digit codes in their Gmail for both login and registration.
*   **Guest Access**: Explore the full platform without an account using the dedicated "Guest Mode".

### 🗺️ Live Geolocation Health Map
*   **Interactive Command Center**: A live, zoomable map using **Leaflet** and **CartoDB Voyager** tiles.
*   **Smart Geolocation**: Automatically centers on the user with pulsing location markers.
*   **Regional Risk Analysis**: Real-time environmental metrics (AQI, UV, Humidity) integrated into pulsing map markers.
*   **Nearby Care Locator**: Nearby medical facility links for elevated screening situations with one-click navigation.

### 🧠 AI-Assisted Wellness Insights
*   **ML Screening Engine**: Estimates wellness risk signals from comprehensive health metrics.
*   **Dynamic Recommendations**: Context-aware health advice that adapts instantly to your latest screening results.
*   **Health Ledger**: Track daily activities, weight, and calories with a beautiful interactive UI.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet.js, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB.
- **AI/ML**: Google Gemini API with configurable model selection.
- **Services**: Google OAuth-ready sign-in demo, Nodemailer (Gmail SMTP).

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (optional, for the local Google sign-in demo)
- Gmail App Password (for OTPs)

### 2. Environment Variables
Create a `.env` file in the **backend** and **frontend** directories.

#### Backend (`/backend/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_digit_app_password
FRONTEND_URL=http://localhost:5173
```

`GEMINI_MODEL` controls which Gemini model the backend uses and defaults to `gemini-2.5-flash` when omitted.
`FRONTEND_URL` should match the deployed frontend origin when running behind Render so CORS allows browser requests.

#### Frontend (`/frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

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
VitalIQ Health uses a curated **Emerald & Slate** design system, utilizing **Glassmorphism** and **Dynamic Micro-animations** to create a polished, trustworthy wellness experience.

---

## 🎉 New Features
- Guest predictions are displayed instantly but not saved to MongoDB for guest users.
- The leaderboard is now "Wellness Streaks" with anonymized names and no personal health data.


## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026 VitalIQ Health. AI-Assisted Wellness Risk Screening Platform.
