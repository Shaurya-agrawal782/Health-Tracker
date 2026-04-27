# 🚀 VitalIQ — AI-Driven Predictive Healthcare Platform

VitalIQ is a cutting-edge MERN-stack platform designed to revolutionize personal healthcare. By leveraging AI-driven analytics, real-time geospatial tracking, and personalized coaching, VitalIQ empowers users to stay ahead of health risks and optimize their wellness journey.

## ✨ Key Features

- **🧠 AI Health Screening**: Advanced risk prediction engine that analyzes lifestyle factors (sleep, stress, activity) to provide a comprehensive health score and confidence level.
- **🗺️ Interactive Regional Health Map**: A Leaflet-powered geospatial dashboard showing live health alerts, air quality warnings, and vaccination camps in your vicinity.
- **🚨 Emergency Medical Locator**: Automatic detection of "High Risk" status with instant links to the nearest hospitals and emergency services via Google Maps.
- **🤖 VitalIQ AI Coach**: A persistent, intelligent chat assistant powered by Gemini AI to answer wellness questions and provide personalized health advice.
- **📊 Dynamic Insights**: Real-time visualization of health trends, weekly averages, and actionable recommendations.
- **🏆 Gamified Leaderboard**: Compete with friends on health metrics and earn reward points for maintaining a healthy streak.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS, React-Leaflet
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Engine**: Google Gemini AI (for Health Coaching & Insights)
- **Deployment**: Render (Auto-deploy on Git push)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (Local or Atlas)
- Google Gemini API Key

### 🔑 Getting your Google Client ID (Free)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Select **Web application** as the application type.
6. Add `http://localhost:5173` to **Authorized JavaScript origins**.
7. Click **Create** and copy your **Client ID**.
8. Paste it into your `.env` file as `VITE_GOOGLE_CLIENT_ID`.

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file based on your environment
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🌐 Deployment (Render)

VitalIQ is optimized for deployment on **Render**.

### To update your deployment:
1. **Push to GitHub**: Any push to the `main` branch will trigger an automatic rebuild on Render.
   ```bash
   git add .
   git commit -m "Upgrade: VitalIQ Platform - AI Insights, Interactive Health Map, and Premium UI Fixes"
   git push origin main
   ```
2. **Environment Variables**: Ensure the following variables are set in your Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `FRONTEND_URL` (Set to your Render frontend URL for CORS)

### Troubleshooting
- **CORS Errors**: If you encounter CORS issues, ensure your Render frontend URL is added to the `allowedOrigins` in `backend/app.js`.
- **Build Failures**: Check the **Logs** tab in Render. Common issues include missing dependencies (ensure `npm install` runs in both directories).

## 📁 Project Structure

```
stitch/
├── backend/            # Express Server, Routes, Controllers, Models, Utils
├── frontend/           # React Frontend (Vite)
│   ├── src/components/ # Reusable UI components (Layout, Dashboard, Maps)
│   ├── src/pages/      # Feature pages (Insights, History, Screening)
│   └── src/services/   # API communication logic (Gemini & Health API)
└── README.md
```

## 👥 Contributors
Built with ❤️ for the Hackathon by Shaurya Agrawal.

---
**VitalIQ** — *Your Health, Predicted.*
