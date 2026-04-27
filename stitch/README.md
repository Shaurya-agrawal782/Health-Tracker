# 🏥 VitalIQ: AI-Powered Predictive Healthcare

VitalIQ is a next-generation health platform that uses Artificial Intelligence to predict health risks, track wellness, and provide live regional health data. Built for the modern user, it combines medical precision with a premium, interactive user experience.

## 🚀 Key Features

### 🛡️ Advanced Authentication Suite
*   **Google Social Login**: Seamless one-tap onboarding.
*   **Two-Step Verification**: Real-world security using **Nodemailer**. Users receive unique 6-digit codes in their Gmail for both login and registration.
*   **Guest Access**: Explore the full platform without an account using the dedicated "Guest Mode".

### 🗺️ Live Geolocation Health Map
*   **Interactive Command Center**: A live, zoomable map using **Leaflet** and **CartoDB Voyager** tiles.
*   **Smart Geolocation**: Automatically centers on the user with pulsing location markers.
*   **Regional Risk Analysis**: Real-time environmental metrics (AQI, UV, Humidity) integrated into pulsing map markers.
*   **Emergency Medical Locator**: Intelligent hospital detection for high-risk zones with one-click navigation.

### 🧠 AI Health Insights & Prediction
*   **ML Screening Engine**: Predicts risks based on comprehensive health metrics.
*   **Dynamic Recommendations**: Context-aware health advice that adapts instantly to your latest screening results.
*   **Health Ledger**: Track daily activities, weight, and calories with a beautiful interactive UI.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet.js, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB.
- **AI/ML**: Google Gemini Pro API.
- **Services**: Google OAuth 2.0, Nodemailer (Gmail SMTP).

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (for Auth)
- Gmail App Password (for OTPs)

### 2. Environment Variables
Create a `.env` file in the **backend** and **frontend** directories.

#### Backend (`/backend/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_google_ai_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_digit_app_password
```

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

---

## 🎨 Visual Identity
VitalIQ uses a curated **Emerald & Slate** design system, utilizing **Glassmorphism** and **Dynamic Micro-animations** to ensure a premium feel that inspires confidence in healthcare.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026 VitalIQ Health. Your Health, Predicted.
