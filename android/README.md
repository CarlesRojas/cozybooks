# CozyBooks for Android

A Bubblewrap TWA wrapping `https://www.cozybooks.app`, plus a native home-screen widget.
Deploying the site updates everything but the widget; you only need a release when
something in this folder changes.

Before the first release: put the keystore at `android/android.keystore` (alias
`cozybook-key-alias`, gitignored) and make sure the CLI is current, or it will quietly
downgrade `targetSdkVersion`.

```sh
npm install -g @bubblewrap/cli@latest
```

## Release an update

```sh
cd android && bubblewrap update && ./apply-splash.sh && bubblewrap build
```


`bubblewrap update` deletes `app/` and regenerates it, so never edit `app/` directly:
`apply-splash.sh` restores the splash masters (`splash/`), `LauncherActivity`
(`launcher/`) and the widget (`widget/`, via `apply-widget.sh`).

## Home-screen widget

Native Java in `widget/`, with no dependencies on purpose so `build.gradle` never needs
patching. It shows one shelf (Reading, Want to read or Finished this year), or Reading and
Want to read with a toggle between them, as a scrolling grid of covers, in the app's light or dark palette following the phone's mode.

It reads `GET /widget/sections` on the Convex deployment's `.convex.site` domain
(`convex/http.ts`), authenticated by a read-only widget token. The token is minted on the
`/widget` page (`api.widget.mintWidgetToken`) and handed to the app through the
`cozybooks://widget-setup` deep link, which `WidgetTokenActivity` stores. Disconnecting on
that page revokes every token, and the widget falls back to its "Grant access" state.

Edit it in `widget/` and re-run `./apply-widget.sh`. Logs: `adb logcat -s CozyBooksWidget:D`.
