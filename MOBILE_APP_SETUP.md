# ThaiHelper Mobile App — Setup & Launch Guide

The native iOS + Android apps are thin Capacitor shells that load the
live website at `thaihelper.app`. Every Vercel deploy ships to the app
instantly — native rebuilds are only needed when we change something
native (icon, splash, plugins, permissions, new app version).

---

## What's already wired up

- ✅ Capacitor 8 + plugins: `app`, `browser`, `push-notifications`,
  `splash-screen`, `status-bar`
- ✅ Android platform under `android/`
- ✅ iOS platform under `ios/`
- ✅ App ID: `app.thaihelper.mobile`
- ✅ Display name: `ThaiHelper`
- ✅ Splash screen: brand-teal background with logo
- ✅ App icons in all sizes (156 generated assets)
- ✅ Android permissions: internet, push, vibrate, wake-lock
- ✅ iOS Info.plist: ATS off for arbitrary loads, photo + camera usage strings

---

## One-time prerequisites

| Tool / account | Why | Cost |
|---|---|---|
| Android Studio | builds + signs the Android app | free |
| Xcode (Mac App Store) | builds + signs the iOS app | free |
| Apple Developer Program | required to ship to App Store + TestFlight | $99/year |
| Google Play Console | required to ship to Play Store | $25 one-time |

Apple takes 1-2 days to verify the developer account, so start there
first.

---

## Daily dev workflow

### Updating native config or plugins

After changing `capacitor.config.ts`, adding a plugin, or editing the
`AndroidManifest.xml` / `Info.plist`, run:

```bash
npx cap sync
```

This copies the latest config to both native projects.

### Updating app icons or splash screens

Edit `assets/icon.png` (1024×1024) or `assets/splash.png` (2732×2732),
then regenerate everything:

```bash
npx capacitor-assets generate
```

That writes 156 size variants into `android/` and `ios/`.

### Running on Android (emulator or device)

```bash
npx cap open android
```

Opens Android Studio. From there: select an emulator or USB-connected
device, click ▶ Run. The app launches and loads `thaihelper.app`.

For a debuggable phone: enable USB debugging in the phone's developer
settings, plug in via USB, accept the prompt.

### Running on iOS (simulator or device)

```bash
npx cap open ios
```

Opens Xcode. From there: pick a simulator (iPhone 15 Pro is fine) or
your physical iPhone (must be on the same Apple ID as the developer
account), click ▶ Run.

For a physical iPhone, the first run also requires trusting the
developer profile on the phone: Settings → General → VPN & Device
Management → tap your name → Trust.

---

## Releasing — Android (Play Store)

1. **In Android Studio**: Build → Generate Signed Bundle / APK →
   pick "Android App Bundle" (`.aab`).
2. First time only: create a new keystore. Save it somewhere safe
   AND back it up — losing this means you can never update the app
   without re-publishing under a new ID. Recommended: store in
   1Password.
3. Upload the `.aab` to https://play.google.com/console under your app.
4. Fill in the store listing (use copy from `scripts/play-store-listing.md`
   once we write it).
5. Submit for review. Google review is typically ~1-3 days.

### When pushing an app update

For most updates (web content only), you don't need to rebuild — the
app re-fetches `thaihelper.app` on launch. Only rebuild if you've:

- Changed `capacitor.config.ts`
- Added or updated plugins
- Changed icons or splash
- Changed permissions
- Bumped the marketing version on Apple's side (every TestFlight build)

Bump `versionCode` and `versionName` in `android/app/build.gradle`
before each Play Store upload — Google rejects duplicate versions.

---

## Releasing — iOS (App Store)

1. **In Xcode**: select target → "Any iOS Device" → Product → Archive.
2. Window → Organizer → pick your archive → Distribute App → App
   Store Connect → Upload.
3. Wait for processing (~15-30 minutes), then go to
   https://appstoreconnect.apple.com, find your app, the new build
   appears there.
4. Add it to TestFlight first (internal testing), then submit for
   App Store Review. Apple review is typically ~1-3 days but can be
   longer for first submissions.

Bump `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in Xcode's
target settings (or directly in `project.pbxproj`) before each
TestFlight build.

---

## Push notifications (later)

The current web push works in-browser already. To get native push:

**Android (FCM):**
1. Create Firebase project at https://console.firebase.google.com
2. Add Android app with package `app.thaihelper.mobile`
3. Download `google-services.json` → drop into `android/app/`
4. Wire FCM token registration into the existing push-subscribe flow

**iOS (APNs):**
1. In Apple Developer Console → Certificates → create APNs Auth Key
2. Upload to Firebase Console (which proxies APNs)
3. Enable Push Notifications capability in Xcode → Signing & Capabilities
4. Same `@capacitor/push-notifications` plugin handles both

This is a Phase 2 task — the web push flow we already have works
inside the Capacitor webview today, just not for backgrounded apps
on iOS. Plan to wire native push after the apps are in the stores.

---

## Useful commands

```bash
# Sync config + assets to native projects
npx cap sync

# Open native IDE
npx cap open android
npx cap open ios

# Run on default emulator/simulator (Capacitor 5+)
npx cap run android
npx cap run ios

# Regenerate icons + splash from /assets
npx capacitor-assets generate

# Live-reload from your dev server (useful for testing)
CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npx cap run android
```

Replace `192.168.x.x` with your Mac's LAN IP so the phone on the same
Wi-Fi can reach `npm run dev`.

---

## Troubleshooting

**"Could not find Android SDK"** — open Android Studio once, let it
install the SDK, then accept the licenses with
`sdkmanager --licenses` or in the Android Studio SDK manager.

**Xcode "no signing certificate"** — Xcode → Settings → Accounts →
add your Apple ID, then in the project target's Signing & Capabilities
pick your team. For development you can use a free team; for App
Store you need the paid developer account.

**App loads but shows a blank screen** — the splash screen never
hides. Check that `https://thaihelper.app` actually loads in a
mobile browser; if it does, check the device's Console for JS errors
(Safari → Develop → [your device] → [your tab]).

**Push isn't received in production but works in dev** — FCM/APNs
keys are different for debug vs release builds. Make sure you have
both registered with Firebase.
