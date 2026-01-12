# Auth (Firebase) + AI (Gemini) setup

This doc explains what you still need to configure in dashboards (Firebase / Apple / Gemini) so the app can:

1) let users sign in with Google / Apple
2) store a basic user profile in Firestore
3) generate AI itineraries via the backend Gemini API

## 1) Firebase Auth only (recommended starter)

In this project, the frontend uses Firebase Auth directly (no custom backend sessions).

### What the code does

- Google login uses a popup OAuth flow.
- Apple login uses OAuthProvider('apple.com') (also popup flow).
- After a successful Google/Apple login, we write/update a user profile doc in Firestore:
  - path: `users/{uid}/profile/public`
  - fields: `uid`, `email`, `displayName`, `photoURL`, `providerId`, `lastLoginAt`

Relevant files:
- `frontend/src/hooks/useAuth.ts` (login + profile write)
- `frontend/src/components/LoginView.tsx` (buttons)

### Firebase Console steps (Google)

1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Ensure your domain is in **Authorized domains**:
   - local dev: `localhost`
   - deployed: your real domain

That’s it for Google.

### Firebase Console + Apple Developer steps (Apple)

Apple Sign-In needs an Apple Developer account.

1. Firebase Console → **Authentication** → **Sign-in method** → **Apple** → Enable
2. In the Apple Developer portal:
   - Create / pick an **App ID**
   - Create a **Service ID** (web signin)
   - Create a **Key** for “Sign in with Apple” (.p8)
3. Back in Firebase Apple provider settings, you’ll see a **redirect URL**.
   - Copy that redirect URL into the Apple Service ID configuration.
4. Provide Firebase with:
   - Service ID
   - Team ID
   - Key ID
   - Private key (contents of the `.p8` file)

Common gotchas:
- Apple requires HTTPS for production domains.
- If the redirect URL doesn’t match exactly, the popup will fail.
- Apple sometimes doesn’t return email on subsequent logins. Store it on first login.

## 2) Firestore “user database” basics

Firestore is your app’s database.

- Your existing trip sync uses `users/{uid}` as a document for trip data.
- The login profile uses `users/{uid}/profile/public`.

You can keep both, but long-term it’s cleaner to store:
- `users/{uid}` for the user profile
- `users/{uid}/trips/{tripId}` for trips

We didn’t restructure that yet; we just added the profile doc without breaking the current trip sync.

## 3) AI setup (Gemini) — yes, it’s connected

Your backend routes are here:
- `POST /api/ai/generate-itinerary`
- `POST /api/ai/refine-itinerary`
- `GET /api/ai/recommendations`

They call `backend/src/services/AITripPlannerService.ts`, which uses the Gemini SDK.

### What you must do

1. Get a Gemini API key (Google AI Studio):
   - https://aistudio.google.com/app/apikey
2. Put it in `backend/.env`:

```
GEMINI_API_KEY=YOUR_KEY_HERE
```

Why backend-only?
- Keeps your AI key secret (never shipped to the browser)
- Lets you add rate limits, input validation, caching

## 4) Environment variables

### Frontend (`frontend/.env.local`)

Copy from `frontend/.env.example` and fill in values.

### Backend (`backend/.env`)

Copy from `backend/.env.example` and fill in values.

## 5) Next: hook AI to “main page location input”

You already have UI flows calling AI in `Wizard.tsx` (currently calling `generateAIItinerary` from `lib/api.ts`).

Recommended direction:
- Use `frontend/src/lib/api-client.ts` everywhere (which calls the backend Gemini routes)
- Update the Wizard and any AI UI to use `apiClient.generateItinerary()`

If you want, I can do that refactor and wire a simple “location → generate plan” action on the app home screen.
