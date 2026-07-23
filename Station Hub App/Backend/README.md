# Station Hub — Backend API

FastAPI REST API for Station Hub. Shared by the mobile app and the owner dashboard. Data lives in **Firebase Firestore**; sessions use **JWT**.

---

## Stack

| Piece | Choice |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | Firebase Firestore (Admin SDK) |
| Auth | JWT (`python-jose`), bcrypt (`passlib`) |
| Config | `python-dotenv` + `.env` |

---

## Setup

### 1. Enter the backend folder

```bash
cd "Station Hub App/Backend"
```

### 2. Virtual environment

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

If you already use `myenv/`, activate that instead.

### 3. Dependencies

```bash
pip install -r requirements.txt
```

### 4. Firebase credentials

Put your service account JSON at:

```text
config/serviceAccountKey.json
```

### 5. Environment (`.env`)

```env
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
FIREBASE_CREDENTIALS=config/serviceAccountKey.json
```

Optional:

```env
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

`GMAIL_*` is used for forgot-password OTP email.

### 6. Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

| URL | Purpose |
|---|---|
| http://localhost:8000 | API root |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/redoc | ReDoc |
| http://localhost:8000/health | Health check |

CORS allows `http://localhost:5173` (dashboard Vite default).

---

## Deploy (Render)

This service targets **Python 3.12** (see `.python-version`). Render’s default is currently **3.14**, which cannot install pinned `pydantic` wheels without a full Rust build.

1. **Root Directory:** `Station Hub App/Backend`
2. **Build command:** `pip install -r requirements.txt`
3. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

Optional but recommended: set environment variable `PYTHON_VERSION=3.12.8` (fully qualified) on the Render service so the runtime stays pinned even if `.python-version` is missing from the build context.

---

## Project layout

```text
Backend/
├── main.py                 # App entry, CORS, routers
├── routes/                 # HTTP routers
├── services/               # Business logic
├── schemas/                # Pydantic models
├── models/                 # Domain models
├── middleware/             # Timing, etc.
├── config/                 # Firebase init + credentials
├── utils/                  # JWT, password, email helpers
├── assets/                 # Static assets (e.g. default services)
├── tests/
└── requirements.txt
```

### Routers

| Prefix | Module | Role |
|---|---|---|
| `/auth` | `routes/auth.py` | Register, login, OTP, password |
| `/profile` | `routes/profile.py` | User profile & avatar |
| `/stations` | `routes/stations.py` | Stations CRUD / discovery |
| `/bookings` | `routes/bookings.py` | Bookings |
| `/services` | `routes/services.py` | Owner services & pricing |
| `/settings` | `routes/settings.py` | Owner settings |
| `/dashboard` | `routes/dashboard.py` | Stats / overview |
| (WebSocket / events) | `routes/booking_events.py` | Booking event stream |

---

## Auth

Protected routes expect:

```http
Authorization: Bearer <access_token>
```

Register seeds default services (Wash, Service, Polishing, Detailing) for new station owners when seeding succeeds.

### Sample register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "03001234567"
}
```

### Sample login response

```json
{
  "message": "Login successful",
  "token": "eyJhbGci...",
  "refresh_token": "...",
  "user": {
    "id": "abc123",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "03001234567",
    "profile_image": ""
  }
}
```

### Auth endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login |
| POST | `/auth/forgot-password` | No | Send OTP |
| POST | `/auth/verify-otp` | No | Verify OTP |
| POST | `/auth/reset-password` | No | Reset password |
| POST | `/auth/change-password` | Yes | Change password |

Full route list is in Swagger at `/docs`.

---

## Firestore collections (common)

| Collection | Description |
|---|---|
| `users` | Accounts (customers & owners) |
| `otps` | Password-reset OTPs |
| `stations` | Service stations |
| `services` | Offerings with category prices |
| `bookings` | Customer bookings |
| `serviceStationStatus` | Service availability per station |

---

## Utility scripts

Run from the Backend directory with the venv active and Firebase configured:

| Script | Purpose |
|---|---|
| `seed_firebase.py` | Seed sample/demo data |
| `migrate_service_pricing.py` | Pricing model migrations |
| `migrate_station_owner_ids.py` | Station owner id backfill |
| `backfill_booking_counts.py` | Booking count backfill |

---

## Security

- Never commit `.env` or `config/serviceAccountKey.json`.
- Use a strong `SECRET_KEY` in production.
- Restrict CORS origins beyond local dashboard when deploying.
