# Station Hub — Owner Dashboard

Web dashboard for **station owners** to manage stations, services (with car/bike category pricing), bookings, notifications, and account settings.

Built with **React 19**, **Vite**, **Tailwind CSS**, and **Firebase** (client config + shared FastAPI backend).

---

## Stack

| Piece | Choice |
|---|---|
| UI | React 19, Tailwind CSS 4 |
| Build | Vite 8 |
| Routing | React Router 7 |
| Motion | Framer Motion |
| Backend | FastAPI (`VITE_API_URL`) |
| Firebase | Client SDK (Firestore listeners, etc.) |

---

## Prerequisites

- Node.js 18+
- Backend running (see [Backend README](../../Station%20Hub%20App/Backend/README.md))
- Firebase web app config for the same project as the backend

---

## Setup

```bash
cd "Station Hub Dashboard/frontend"
npm install
```

### Environment (`.env`)

```env
VITE_API_URL=http://localhost:8000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | FastAPI base URL (no trailing slash) |
| `VITE_FIREBASE_*` | Firebase web app config from the Firebase console |

### Start (development)

```bash
npm run dev
```

Default: [http://localhost:5173](http://localhost:5173)

The API enables CORS for this origin.

### Build & preview

```bash
npm run build
npm run preview
```

```bash
npm run lint
```

---

## Project structure

```text
frontend/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── routes.jsx
│   ├── protectedRoutes.jsx
│   ├── api/api.js              # HTTP client → backend
│   ├── firebase.js
│   ├── context/
│   │   ├── theme.Context.jsx
│   │   └── NotificationContext.jsx
│   ├── components/modals/
│   ├── pages/
│   │   ├── auth/               # Login, signup
│   │   ├── home/               # Shell layout + sidebar
│   │   ├── LandingPage/
│   │   ├── dashboard/          # Stats overview
│   │   ├── Stations/           # Station management
│   │   ├── services/           # Services & category pricing
│   │   ├── notification/
│   │   ├── profile/
│   │   └── settings/
│   └── assets/
└── package.json
```

---

## Main pages

| Path | Purpose |
|---|---|
| `/` / landing | Marketing / entry |
| Login & signup | Owner authentication |
| `/dashboard` | Totals and recent activity |
| `/stations` | Stations and service availability |
| `/services` | Create/edit services, car & bike categories |
| Notifications | Booking-related alerts |
| `/profile` | Account details |
| `/settings` | Theme, hide services, clear data |

---

## Features

- Sidebar navigation with dark/light theme
- Service pricing by vehicle category (sedan, SUV, economy/standard/premium bike, etc.)
- Link services to stations; toggle availability
- Dashboard metrics and booking visibility
- Settings for service visibility and account preferences

---

## API usage

HTTP calls go through `src/api/api.js` using `VITE_API_URL`. Authenticated requests send the owner JWT stored after login.

Ensure the backend is up before using dashboard data screens:

```bash
cd "../../Station Hub App/Backend"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Related

- Backend: [../../Station Hub App/Backend/README.md](../../Station%20Hub%20App/Backend/README.md)
- Mobile app: [../../Station Hub App/Frontend/README.md](../../Station%20Hub%20App/Frontend/README.md)
- Root monorepo: [../../README.md](../../README.md)
