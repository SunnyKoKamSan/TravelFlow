# Apple Sign-In Setup Guide

## What you need to do (in order)

Apple Sign-In requires setup in **two places**:
1. **Apple Developer Console** (create identifiers and keys)
2. **Firebase Console** (paste those credentials)

---

## Part 1: Apple Developer Console Setup

### Prerequisites
- You must have an **Apple Developer Program membership** ($99/year)
- Sign in at: https://developer.apple.com/account

### Step 1: Create an App ID (if you don't have one)

1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** in the sidebar
3. Click the **+** button (top left)
4. Select **App IDs** → Continue
5. Choose **App** → Continue
6. Fill in:
   - **Description**: `TravelFlow App`
   - **Bundle ID**: `com.sunnyko.travelflow` (or your own reverse domain)
7. Scroll down and enable **Sign in with Apple**
8. Click **Continue** → **Register**

**Where to find it later**: Identifiers → (your app ID)

---

### Step 2: Create a Service ID (for web/Firebase)

This is **required** for web-based Apple Sign-In.

1. Still in **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **+** button
3. Select **Services IDs** → Continue
4. Fill in:
   - **Description**: `TravelFlow Web Sign In`
   - **Identifier**: `com.sunnyko.travelflow.web` (must be unique, can't be same as App ID)
5. Enable **Sign in with Apple**
6. Click **Configure** (next to Sign in with Apple)
7. In the popup:
   - **Primary App ID**: select the App ID you created in Step 1
   - **Website URLs**:
     - Click **+** (Add Domain)
     - **Domains and Subdomains**: `travelflow-93388.firebaseapp.com`
     - **Return URLs**: `https://travelflow-93388.firebaseapp.com/__/auth/handler`
   - Click **Next** → **Done** → **Continue** → **Register**

**✅ SAVE THIS**: The **Service ID** (e.g., `com.sunnyko.travelflow.web`) — you'll need it for Firebase.

**Where to find it later**: Identifiers → (your service ID) → look at "Identifier" field

---

### Step 3: Create a Sign in with Apple Key (.p8 private key)

1. Go to **Keys** (in sidebar)
2. Click **+** button
3. Fill in:
   - **Key Name**: `TravelFlow Apple Sign In Key`
4. Enable **Sign in with Apple**
5. Click **Configure** next to it
6. Select your **Primary App ID** (from Step 1)
7. Click **Save** → **Continue** → **Register**
8. **IMPORTANT**: Click **Download** to get the `.p8` file
   - ⚠️ **You can only download this ONCE**. Save it securely!
9. After download, note:
   - **Key ID** (shown at the top, looks like `ABC123XYZ4`)
   - The `.p8` file contents (open in text editor)

**✅ SAVE THESE**:
- **Key ID**: `ABC123XYZ4` (example)
- **Private Key**: The entire contents of the `.p8` file (starts with `-----BEGIN PRIVATE KEY-----`)

**Where to find Key ID later**: Keys → (your key name) → look at "Key ID"
**Where to find private key later**: You CAN'T. If you lose the .p8 file, you must create a new key.

---

### Step 4: Find your Team ID

1. In Apple Developer Console, click your **name** (top right)
2. Or go to: **Membership** (in sidebar)
3. Look for **Team ID** (10-character string, like `A1B2C3D4E5`)

**✅ SAVE THIS**: **Team ID**: `A1B2C3D4E5` (example)

**Where to find it later**: Membership page → Team ID

---

## Part 2: Firebase Console Setup

Now you'll paste the Apple credentials into Firebase.

### Step 5: Enable Apple Provider in Firebase

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **travelflow-93388**
3. Go to **Authentication** → **Sign-in method** tab
4. Find **Apple** in the list → Click it
5. Toggle **Enable** to ON
6. Fill in the required fields:

**Service ID** (from Step 2):
```
com.sunnyko.travelflow.web
```

**Apple Team ID** (from Step 4):
```
A1B2C3D4E5
```

**Key ID** (from Step 3):
```
ABC123XYZ4
```

**Private Key** (from Step 3):
Paste the entire contents of your `.p8` file, including the header/footer:
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(multiple lines)
...xyz123==
-----END PRIVATE KEY-----
```

7. Click **Save**

---

## Part 3: Test Apple Sign-In

1. Run your frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:5173

3. Click **Continue with Apple**

4. You should see Apple's sign-in popup

**Common issues**:
- **"Provider not enabled"**: You didn't save the credentials in Firebase (Step 5)
- **"Invalid configuration"**: One of the IDs/keys is wrong — double-check each one
- **Popup blocked**: Allow popups for localhost in your browser
- **"Domain not verified"**: Apple may require domain verification — usually works automatically with Firebase's domain

---

## Summary Checklist

From **Apple Developer Console**, you need:
- ✅ **Service ID** (e.g., `com.sunnyko.travelflow.web`)
- ✅ **Team ID** (e.g., `A1B2C3D4E5`)
- ✅ **Key ID** (e.g., `ABC123XYZ4`)
- ✅ **Private Key** (.p8 file contents)

Paste all four into **Firebase Console → Authentication → Apple provider settings**.

---

## Notes for Web vs iOS

- **Web only** (your current case): You only need the **Service ID** + credentials above
- **iOS app later**: You'll use the same **App ID** but won't need the Service ID for native iOS sign-in

Your current setup is **web-only** via Firebase, which is correct for a React/Vite frontend.

---

## If you don't have Apple Developer Program membership

Without the $99/year Apple Developer Program membership, you **cannot** enable Apple Sign-In for web/production.

**Alternative**:
- Remove the Apple button for now
- Keep only **Google + Guest** login
- Add Apple later when you join the developer program

If you want, I can comment out the Apple button in your code so the app works with just Google.
