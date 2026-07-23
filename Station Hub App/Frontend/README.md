# Station Hub — Mobile App

Customer-facing **React Native (Expo)** app for discovering vehicle service stations and booking wash, service, polishing, detailing, and related offerings.

---

## Stack

| Piece | Choice |
|---|---|
| Runtime | Expo SDK ~51, React Native 0.74 |
| Routing | Expo Router (file-based) |
| Storage | AsyncStorage (tokens, cache) |
| Maps / location | `react-native-maps`, `expo-location` |
| API | Shared FastAPI backend via `src/api.ts` |

---

## Prerequisites

- Node.js 18+
- Backend running (see [Backend README](../Backend/README.md))
- Expo Go **or** Android/iOS emulator **or** a development build

---

## Setup

```bash
cd "Station Hub App/Frontend"
npm install
```

### Environment (`.env`)

```env
EXPO_PUBLIC_API_PORT=8000
EXPO_PUBLIC_API_URL=
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_PORT` | Backend port (default `8000`) |
| `EXPO_PUBLIC_API_URL` | Optional full base URL. If empty, the app picks a host from Expo (`hostUri`) or uses `10.0.2.2` on Android emulator / `localhost` otherwise |

See `src/config.ts` for resolution logic.

### Start

```bash
npm start
# same as: npx expo start
```

Other scripts:

```bash
npm run android   # expo run:android
npm run ios       # expo run:ios
npm run web       # expo start --web
```

In the Expo CLI, open with Expo Go, an emulator, or a dev client.

---

## App structure

```text
Frontend/
├── app/
│   ├── (auth)/               # Landing, login, signup, OTP, reset password
│   ├── (tabs)/
│   │   ├── Home/             # Home, station detail, notifications
│   │   ├── Booking/          # Book + confirmation
│   │   ├── service/          # Service catalog
│   │   └── profile/          # Profile, history, settings screens
│   ├── onboarding/
│   ├── splash/
│   ├── set-location.tsx
│   └── choose-location.tsx
├── components/               # e.g. Bottomnav
├── context/                  # User provider
├── hooks/                    # e.g. useHardwareDoubleBackToExit
├── src/
│   ├── api.ts                # apiFetch + token refresh
│   ├── config.ts             # API_BASE
│   └── ...
├── utils/                    # e.g. uiGoBack
├── assets/
└── app.json
```

---

## Main features

- Auth with JWT; automatic refresh via `apiFetch`
- Nearby stations from current or chosen location
- Station detail and offered services
- Booking flow with vehicle type and category (car/bike)
- My bookings, profile, FAQs, about, privacy
- Android hardware back: double-press to exit on root tabs; header back uses `uiGoBack` (never exits)

---

## API client

All authenticated calls should go through:

```ts
import { apiFetch } from "../src/api";
import { API_BASE } from "../src/config";
```

`apiFetch` attaches the access token, retries once after refresh on `401`, and sends the user to login if refresh fails.

---

## Backend URL tips

| Environment | Suggested base |
|---|---|
| Android emulator | Auto → `http://10.0.2.2:8000` when no Expo host |
| Physical device (same LAN) | Leave `EXPO_PUBLIC_API_URL` empty so host is taken from Expo, or set your machine IP, e.g. `http://192.168.x.x:8000` |
| iOS simulator / web | Often `http://localhost:8000` |

Backend must be reachable on the device/emulator network.

---

## Related

- Backend: [../Backend/README.md](../Backend/README.md)
- Root monorepo: [../../README.md](../../README.md)
