# VitalIQ Health Backend

VitalIQ Health backend powers authentication, guest access, wellness screening, recommendation generation, history tracking, and privacy-safe wellness streaks.

## Safety Disclaimer

VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Nodemailer
- Gemini API (@google/generative-ai)
- express-rate-limit
- CORS
- dotenv

## Base URL

**Local:**
`http://localhost:5000/api`

**Production:**
`https://your-backend-service.onrender.com/api`

## Environment Variables

Copy the example file and fill in your real values — **never commit `.env`**:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | Set to `production` on Render, `development` locally |
| `MONGO_URI` | **Yes** | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | **Yes** | Long random string for signing JWT tokens |
| `JWT_EXPIRE` | No | Token lifetime (default: `7d` — e.g. `24h`, `30d`) |
| `FRONTEND_URL` | **Yes (prod)** | Exact frontend origin URL for CORS allow-list |
| `GEMINI_API_KEY` | **Yes** | API key from [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-2.5-flash`) |
| `EMAIL_USER` | **Yes** | Gmail address used to send OTP emails |
| `EMAIL_PASS` | **Yes** | Gmail App Password (16 chars — **not** your login password) |
| `ML_API_URL` | No | External FastAPI ML service URL (default: `http://localhost:8000`; falls back to Gemini AI if unreachable) |

> See [`backend/.env.example`](./.env.example) for a fully-commented template.

## Authentication Routes

*All auth and OTP routes are protected by rate limiters.*

- **POST `/api/auth/send-register-otp`**
  - **Purpose:** Sends an OTP to the user's email for registration verification.
  - **Auth Required:** No

- **POST `/api/auth/register`**
  - **Purpose:** Registers a new user.
  - **Auth Required:** No

- **POST `/api/auth/login`**
  - **Purpose:** Initiates the login process using email and password.
  - **Auth Required:** No

- **POST `/api/auth/verify-otp`**
  - **Purpose:** Verifies the OTP sent to the user's email.
  - **Auth Required:** No

- **POST `/api/auth/forgot-password`**
  - **Purpose:** Sends a password reset OTP to the user's email.
  - **Auth Required:** No

- **POST `/api/auth/reset-password`**
  - **Purpose:** Resets the password using the verified OTP.
  - **Auth Required:** No

- **POST `/api/auth/guest`**
  - **Purpose:** Creates a temporary guest session.
  - **Auth Required:** No

- **GET `/api/auth/profile`**
  - **Purpose:** Retrieves the authenticated user's profile.
  - **Auth Required:** Yes (Bearer Token)

- **GET `/api/auth/leaderboard`**
  - **Purpose:** Retrieves the privacy-safe Wellness Streaks leaderboard.
  - **Auth Required:** No

## Wellness Prediction Routes

*All prediction routes require authentication (Bearer Token).*
*Note: For guest users, predictions work to provide real-time insights but are not permanently saved to the database.*

- **POST `/api/predict`**
  - **Purpose:** Submit screening data for ML prediction.

- **GET `/api/predict/history`**
  - **Purpose:** Retrieve past predictions for the user (real users only).

- **GET `/api/predict/:id`**
  - **Purpose:** Retrieve a specific prediction by its ID.

## Health Tracking Routes

*All health tracking routes require authentication (Bearer Token).*

- **POST `/api/health/add`**
  - **Purpose:** Add daily health metrics.
- **GET `/api/health/latest`**
  - **Purpose:** Get the most recent health data submission.
- **GET `/api/health/history`**
  - **Purpose:** Retrieve historical health data.
- **GET `/api/health/risk`**
  - **Purpose:** Retrieve health risk summary based on recent metrics.
- **GET `/api/health/summary`**
  - **Purpose:** Retrieve overall health summary.
- **POST `/api/health/chat`**
  - **Purpose:** Chat with the AI health coach.

## Recommendations Routes

*All recommendation routes require authentication (Bearer Token).*

- **GET `/api/recommendations`**
  - **Purpose:** Get personalized wellness recommendations based on the user's profile and recent assessments.

## Security Features

- **JWT authentication** for secure session management.
- **bcrypt password hashing** to securely store user credentials.
- **hashed OTP storage** to protect verification codes.
- **rate limiting on auth/OTP routes** to prevent brute-force attacks.
- **CORS restricted by `FRONTEND_URL`** to allow requests only from trusted origins.
- **guest JWT sessions** for exploring the platform safely without an account.
- **privacy-safe Wellness Streaks** using anonymized leaderboard displays.

## Run Locally

```bash
npm install
npm run dev
```

## Deployment Notes

For **Render Web Service**:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Add all required environment variables in the Render dashboard.
