# CozyBooks for Android

A [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) **Trusted Web Activity** —
a thin native shell that opens `https://www.cozybooks.app` fullscreen in Chrome, with no
browser UI. There is no app code here: whatever is deployed to the site is what ships.
The only way to change what users see is to deploy the web app.

## Key facts

| | |
| --- | --- |
| Package | `app.cozybooks.pinya` |
| Domain | `https://www.cozybooks.app` |
| Keystore | `android/android.keystore`, alias `cozybook-key-alias` |
| Min / compile / target SDK | 21 / 36 / 35 |
| Shortcuts | Finished Books → `/finished`, Search Books → `/search` |

Play enforces a minimum `targetSdkVersion` every August 31, one API level per year — API
35 from Aug 2025, API 36 from Aug 2026. Updates below the current floor are rejected, so
raise `targetSdkVersion` in `app/build.gradle` ahead of each deadline. For a TWA the risk
is low: the UI is Chrome's, and this shell is only a launcher activity.

## Prerequisites

```sh
npm install -g @bubblewrap/cli
bubblewrap doctor          # checks the JDK and Android SDK
```

Bubblewrap downloads and manages its own JDK and Android SDK on first run, and remembers
where they are in `~/.bubblewrap/config.json`. To point it at existing installs:

```sh
bubblewrap updateConfig --jdkPath=<path> --androidSdkPath=<path>
```

The keystore is **not** in the repo (`*.keystore` is gitignored). Put it at
`android/android.keystore` before building, or edit `signingKey.path` in
`twa-manifest.json`. It has to be the same key the live app was signed with — or the
Play upload key, if the app uses Play App Signing.

## Building a release

From this folder:

```sh
bubblewrap build
```

It asks for the keystore and key passwords, or reads them from
`BUBBLEWRAP_KEYSTORE_PASSWORD` and `BUBBLEWRAP_KEY_PASSWORD`. Output:

- `app-release-bundle.aab` — upload this to the Play Console
- `app-release-signed.apk` — for sideloading; `bubblewrap install` pushes it to a
  connected device over adb

Both are gitignored.

## Releasing a new version

Only needed when something in this folder changes. A web-app deploy reaches users
immediately and needs no release at all.

1. Bump `versionCode` and `versionName` in `app/build.gradle`, and `appVersionCode`,
   `appVersionName` and `appVersion` in `twa-manifest.json` — they must agree, and
   `versionCode` must be higher than the last one uploaded to Play.
2. Recompute the checksum (see below).
3. `bubblewrap build`
4. Play Console → Production → Create new release → upload the `.aab`.

## `manifest-checksum.txt`

This file is `sha1(twa-manifest.json)`. Bubblewrap compares it on every build; if it does
not match, it offers to regenerate the whole project from `twa-manifest.json` — which
**re-downloads every icon from the live site and bumps `appVersionCode` by one**.

So after hand-editing `twa-manifest.json`, either accept that regeneration, or keep the
edit by recomputing the checksum first:

```sh
shasum -a 1 twa-manifest.json | cut -d' ' -f1 | tr -d '\n' > manifest-checksum.txt
```

(No trailing newline — Bubblewrap compares the raw file contents.)

## Changing icons, name or shortcuts

These are driven by `public/manifest.json` on the web side and mirrored here. To pull
web-manifest changes into the Android config:

```sh
bubblewrap merge      # merges the live web manifest into twa-manifest.json
bubblewrap update     # regenerates the project, re-fetching icons from the site
```

Both need the changes **deployed** first — they read `https://www.cozybooks.app/manifest.json`
and the icon URLs in `twa-manifest.json`, not the local files. `update` also bumps
`appVersionCode`; pass `--skipVersionUpgrade` to leave it alone.

Icon sources, if regenerating by hand: `public/maskableIcon512.png` for the launcher,
maskable, splash and notification icons, and `public/shortcut/{finished,search}.png` for
the shortcuts.

## Digital Asset Links

`public/.well-known/assetlinks.json` is what makes the TWA open without a URL bar. It has
to declare `app.cozybooks.pinya` with the SHA-256 of the **app signing certificate** —
under Play App Signing that is Google's certificate (Play Console → Setup → App signing),
not your upload key. Verify with:

```sh
bubblewrap fingerprint list
bubblewrap fingerprint generateAssetLinks --output=../public/.well-known/assetlinks.json
```

If the app opens with a browser address bar visible, this file is wrong or not being
served.

## What is in here

| Path | |
| --- | --- |
| `twa-manifest.json` | Bubblewrap's source of truth — package, domain, colors, icons, shortcuts, signing key |
| `app/build.gradle` | Generated from `twa-manifest.json`; also regenerates `res/xml/shortcuts.xml` on every build |
| `app/src/main/res/` | Generated icons, splash screens and strings |
| `app/src/main/res/raw/web_app_manifest.json` | Copy of the site's `manifest.json`, used by Chrome OS |
| `app/src/main/java/app/cozybooks/pinya/` | Bubblewrap's stock TWA activity, service and application classes |
| `manifest-checksum.txt` | Staleness check, see above |
| `store_icon.png` | 512×512 Play listing icon |

Other Play listing assets live on the web side: `public/featureGraphic/FeatureGraphic.png`
(1024×500), `public/screenshot/screenshot1..5.png` (1080×1920), and the `description` and
`full-description` fields in `public/manifest.json`.
