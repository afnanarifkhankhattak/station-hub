<div align="center">

# Station Hub

**Find nearby vehicle service stations, book wash & maintenance services, and manage your business — all in one place.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Expo](https://img.shields.io/badge/Mobile-Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React](https://img.shields.io/badge/Dashboard-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)

</div>

---

## About

**Station Hub** is a full-stack platform for vehicle service stations (wash, service, polishing, detailing, and more). Customers discover nearby stations and book appointments from a mobile app. Station owners manage stations, services, pricing by vehicle category, and bookings from a web dashboard.

| Component | Description |
|---|---|
| **Mobile app** | Customer-facing app (React Native + Expo) |
| **Dashboard** | Station-owner panel (React + Vite + Tailwind) |
| **Backend API** | Shared FastAPI service on Firebase Firestore |

---

## Features

### Mobile app
- JWT auth (register, login, OTP password reset)
- Nearby station discovery via device location
- Station details, offered services, and schedules
- Book by vehicle type, category, date, and time
- Booking history and push-style notifications
- Profile, FAQs, privacy policy, and change password
- Android double-back-to-exit and consistent UI back navigation

### Owner dashboard
- Overview stats (stations, users, bookings)
- Station CRUD and service–station linking
- Services with car/bike category pricing
- Booking list and live-style notifications
- Settings (theme, hide services, bulk clear)
- Protected routes and dark/light mode

### Backend API
- Routers for auth, profile, stations, bookings, services, settings, dashboard, and booking events
- Firebase Admin SDK + Firestore
- JWT access/refresh tokens and bcrypt passwords
- Default service catalog seeded for new station owners

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, Expo Router |
| Dashboard | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Uvicorn, Python |
| Data / Auth | Firebase Firestore, JWT (`python-jose`), bcrypt |

---

## Project structure

```
station-hub/
├── Station Hub App/
│   ├── Frontend/                 # Expo mobile app
│   │   ├── app/                  # Auth, tabs, onboarding, splash
│   │   ├── components/           # Shared UI (e.g. bottom nav)
│   │   ├── context/              # User context
│   │   ├── hooks/                # e.g. hardware back
│   │   ├── src/                  # API client, config
│   │   └── utils/
│   └── Backend/                  # FastAPI API
│       ├── routes/
│       ├── services/
│       ├── schemas/
│       ├── models/
│       ├── middleware/
│       ├── config/               # Firebase credentials path
│       └── assets/               # Default service images
└── Station Hub Dashboard/
    └── frontend/                 # Owner web app
        └── src/
            ├── pages/            # Dashboard, stations, services, …
            ├── components/
            ├── context/          # Theme, notifications
            └── api/
```

---

## Getting started

Prerequisites: **Node.js 18+**, **Python 3.10+**, and a **Firebase** project with a service account key.

### 1. Backend

```bash
cd "Station Hub App/Backend"
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Place `serviceAccountKey.json` in `config/`, then create `.env`:

```env
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
FIREBASE_CREDENTIALS=config/serviceAccountKey.json
```

Optional (password-reset email OTP):

```env
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_app_password
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Start the API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: [http://localhost:8000](http://localhost:8000)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Mobile app

```bash
cd "Station Hub App/Frontend"
npm install
```

`.env` example:

```env
EXPO_PUBLIC_API_PORT=8000
EXPO_PUBLIC_API_URL=          # optional; leave empty to auto-detect host in dev
```

```bash
npm start
# or: npx expo start
```

Use Expo Go, an emulator, or a development build. On Android emulator without a host URI, the client defaults to `http://10.0.2.2:8000`.

### 3. Owner dashboard

```bash
cd "Station Hub Dashboard/frontend"
npm install
```

`.env` example:

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

```bash
npm run dev
```

Dashboard typically runs at [http://localhost:5173](http://localhost:5173) (CORS is enabled for this origin on the API).

---

## Environment overview

| App | File | Key variables |
|---|---|---|
| Backend | `Station Hub App/Backend/.env` | `SECRET_KEY`, `ALGORITHM`, `FIREBASE_CREDENTIALS` |
| Mobile | `Station Hub App/Frontend/.env` | `EXPO_PUBLIC_API_PORT`, `EXPO_PUBLIC_API_URL` |
| Dashboard | `Station Hub Dashboard/frontend/.env` | `VITE_API_URL`, `VITE_FIREBASE_*` |

---

## Security

- Do **not** commit `serviceAccountKey.json`, `.env`, or `google-services.json`.
- Rotate any secret that is exposed; scrub git history if needed (`git filter-repo`).

---

## Docs in this repo

| README | Scope |
|---|---|
| [Station Hub App/Backend/README.md](./Station%20Hub%20App/Backend/README.md) | API setup, collections, endpoints |
| [Station Hub App/Frontend/README.md](./Station%20Hub%20App/Frontend/README.md) | Mobile app setup & structure |
| [Station Hub Dashboard/frontend/README.md](./Station%20Hub%20Dashboard/frontend/README.md) | Dashboard setup & pages |

---

## License

MIT — see project license terms as applicable.

---

<p align="center">Built for smarter vehicle service discovery and station management.</p>
