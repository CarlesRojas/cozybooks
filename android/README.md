# CozyBooks for Android

A Bubblewrap TWA wrapping `https://www.cozybooks.app`. There is no app code here, so
deploying the site is what updates the app. You only need a release when something in
this folder changes.

Put the keystore at `android/android.keystore` (alias `cozybook-key-alias`) first. It is
gitignored.

## Release an update

1. Bump the version in both files. They must agree, and beat the last upload.

   | File | Fields |
   | --- | --- |
   | `app/build.gradle` | `versionCode`, `versionName` |
   | `twa-manifest.json` | `appVersionCode`, `appVersionName`, `appVersion` |

2. Refresh the checksum:

   ```sh
   shasum -a 1 twa-manifest.json | cut -d' ' -f1 | tr -d '\n' > manifest-checksum.txt
   ```

3. Build, then upload `app-release-bundle.aab` in Play Console under Production, Create
   new release:

   ```sh
   bubblewrap build
   ```

Step 2 is not optional. With a stale checksum, `bubblewrap build` offers to regenerate the
project, which undoes your version bump, overwrites the splash, and can drop
`targetSdkVersion` back to whatever your CLI's template says.

## After `bubblewrap update`

`update` regenerates everything and bumps the version itself, so skip step 1:

```sh
bubblewrap update
./apply-splash.sh
bubblewrap build
```

## Splash

The splash screens live in `splash/`. `apply-splash.sh` copies them into
`app/src/main/res/drawable-*/`. Edit `splash/`, never `res/`, which gets overwritten.

## Target API

Play requires `targetSdkVersion` within a year of the latest Android release, enforced
every August 31 (36 as of Aug 2026). It comes from Bubblewrap's template rather than
`twa-manifest.json`, so keep the CLI current:

```sh
npm install -g @bubblewrap/cli@latest
```
