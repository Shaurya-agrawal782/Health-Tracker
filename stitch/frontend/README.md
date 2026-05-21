# VitalIQ Health Frontend

Frontend for VitalIQ Health, an AI-assisted wellness risk-screening platform that helps users track lifestyle metrics, estimate wellness risk levels, and receive personalized wellness recommendations.

VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` creates a production build.
- `npm run lint` checks the React source with ESLint.
- `npm run preview` serves the production build locally.

## Notes

This app contains the public landing page, auth screens, wellness dashboard, risk screening flow, insights, recommendations, meal planner, and leaderboard UI.

## Environment

Create `frontend/.env` for local development:

```env
VITE_API_URL=http://localhost:5000/api
```

For Render static-site deployment, set `VITE_API_URL` to the deployed backend API URL:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

The backend Render service should also set `FRONTEND_URL=https://your-frontend-service.onrender.com` so CORS allows requests from the static site.
