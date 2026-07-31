# Play Store TODO

The wrapper is a Bubblewrap TWA around `https://www.cozybooks.app`, published as
`app.cozybooks.pinya`. Everything in this folder is already pointed at CozyBooks —
these are the steps left that need your machine or the Play Console.

## 1. Keystore

`twa-manifest.json` expects:

- path: `/Users/carles.rojas/Documents/Repos/cozybooks/android/android.keystore`
- alias: `cozybook-key-alias`

Drop your existing CozyBooks keystore there, or edit those two fields to match where
it actually lives. It must be the same key the live app was signed with (or your Play
upload key, if the app uses Play App Signing) — a different key means Play rejects the
update. The keystore is gitignored, so it never gets committed.

## 2. Build

From `android/`:

```sh
bubblewrap build
```

It prompts for the keystore and key passwords (or reads `BUBBLEWRAP_KEYSTORE_PASSWORD`
and `BUBBLEWRAP_KEY_PASSWORD`). Output is `app-release-bundle.aab`.

Bubblewrap installs its own JDK and Android SDK on first run.

## 3. Version code

`versionCode` is **2** (`app/build.gradle` and `twa-manifest.json`), one above the 1
currently live on Play. Bump both files for each subsequent release.

## 4. Verify Digital Asset Links

`public/.well-known/assetlinks.json` declares `app.cozybooks.pinya` with fingerprint
`40:E9:77:...:77:59`. Two things must hold or the app opens with a browser URL bar
instead of fullscreen:

- That fingerprint matches the **app signing certificate** in Play Console →
  Setup → App signing (with Play App Signing this is Google's cert, not your upload key).
- `https://www.cozybooks.app/.well-known/assetlinks.json` is actually served — deploy the
  site before rolling out.

## 5. Upload

Play Console → Production → Create new release → upload the `.aab`.

Store assets already in the repo if the listing needs refreshing:

- Icon: `android/store_icon.png` (512×512)
- Feature graphic: `public/featureGraphic/FeatureGraphic.png` (1024×500)
- Screenshots: `public/screenshot/screenshot1..5.png` (1080×1920)
- Descriptions: `name`, `description` and `full-description` in `public/manifest.json`

## Optional

Notification delegation is on (inherited from the CueNext wrapper), which adds the
`POST_NOTIFICATIONS` permission. CozyBooks never requests web notifications, so it is
inert — but if you would rather not declare the permission, set `enableNotifications`
to `false` in `twa-manifest.json` and rebuild.
