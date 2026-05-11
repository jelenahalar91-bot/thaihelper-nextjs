/**
 * Capacitor configuration for the ThaiHelper iOS + Android apps.
 *
 * Strategy: thin native shell over the live PWA at thaihelper.app.
 * The app loads the deployed website directly, so every web update
 * (Vercel deploy) ships to the app immediately — no native rebuild
 * required for content changes. Native rebuilds are only needed when
 * we change something native: app icon, splash screen, plugins,
 * permissions.
 *
 * Local development: set CAPACITOR_SERVER_URL to your dev URL (e.g.
 * http://192.168.x.x:3000 for testing on a real device with `npm run
 * dev`). Falls back to the production URL.
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.thaihelper.mobile',
  appName: 'ThaiHelper',

  // Capacitor still needs a webDir even when we load from a remote
  // server — used for the fallback bundle when the device is offline.
  // We point at Next's static export output.
  webDir: 'out',

  // Load the live site instead of a bundled static export. This is
  // the SaaS-style "thin native shell" pattern.
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://thaihelper.app',
    androidScheme: 'https',
    // Required for the Android <-> Capacitor bridge to work when
    // loading a remote URL.
    cleartext: false,
  },

  // Per-platform settings
  ios: {
    // Handle the iOS notch / Dynamic Island so the webview doesn't
    // overlap the status bar.
    contentInset: 'always',
    // Make pull-to-refresh feel right (default scrollable behavior)
    scrollEnabled: true,
    // ThaiHelper does its own scroll behavior — no extra elastic
    // bouncing on top.
    backgroundColor: '#ffffff',
  },
  android: {
    // Match the manifest theme color so the system bar blends.
    backgroundColor: '#ffffff',
    // Allow the webview to use mixed content (HTTP within HTTPS) is
    // OFF — production should be HTTPS-only. cleartext stays false.
    allowMixedContent: false,
  },

  plugins: {
    // Splash screen — shown while the webview boots and pulls the
    // initial page. Keep it short and on-brand.
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#006a62', // brand teal
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Native push notifications — wires APNs (iOS) + FCM (Android)
    // through the same JS API. The web app's existing push code
    // continues to work; the plugin adds iOS support that the browser
    // PushManager doesn't cover.
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
