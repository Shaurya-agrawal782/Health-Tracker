# 🏥 Stitch Health — AI-Driven Predictive Healthcare Platform

A full-stack MERN application that helps users track their lifestyle, receive AI-powered health risk predictions, and get personalized wellness recommendations.

## 🏗️ Architecture

```
Frontend (React + Vite)  →  REST API  →  Backend (Node + Express)  →  MongoDB
                                              ↓
                                    ML Model (Future - Python/Flask)
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
# Edit .env with your MongoDB URI
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login + JWT |
| GET | `/api/auth/profile` | ✅ | Get user profile |
| POST | `/api/health/add` | ✅ | Log daily health data |
| GET | `/api/health/history` | ✅ | Paginated health history |
| GET | `/api/health/latest` | ✅ | Latest health entry |
| GET | `/api/health/risk` | ✅ | Risk assessment (rule-based) |
| GET | `/api/health/summary` | ✅ | Aggregated stats + trends |
| GET | `/api/recommendations` | ✅ | Personalized health advice |

## 🧠 Risk Prediction (Rule-Based → ML-Ready)

Currently uses a deterministic rule engine that scores risk factors:

| Factor | Max Impact |
|--------|-----------|
| Sleep deficit | +25% |
| High stress | +25% |
| Low exercise | +20% |
| High BMI | +15% |
| Smoking | +15% |
| Alcohol | +10% |
| Poor diet | +10% |
| Low steps | +10% |
| Low water | +5% |

**Output format matches ML API response:**
```json
{
  "level": "High",
  "score": 72,
  "confidence": 0.87,
  "factors": [...],
  "explanation": "Key risk drivers: Critical Sleep Deficit + Extreme Stress + Smoking"
}
```

## 🤖 ML Integration (Future)

The architecture is designed for drop-in ML model replacement:

```javascript
// Current: Rule-based (backend/utils/riskCalculator.js)
const risk = calculateRisk(healthData, user);

// Future: ML API call
const risk = await fetch('http://ml-service:8000/predict-risk', {
  method: 'POST',
  body: JSON.stringify({ sleep, activity, diet, stress })
});
```

## 🛡️ Security

- JWT Authentication with Bearer tokens
- Password hashing with bcrypt (10 rounds)
- Input validation with express-validator
- Protected routes (frontend + backend)
- Environment variables for secrets

## 📁 Project Structure

```
stitch/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Risk calculator + recommendation engine
│   ├── app.js           # Express app
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── components/  # UI + dashboard + layout
│       ├── context/     # Auth context
│       ├── pages/       # Route pages
│       ├── services/    # API client
│       └── App.jsx      # Router
└── README.md
```

## 👥 Team

Built for hackathon by Team Stitch 🧵
