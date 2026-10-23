#!/bin/sh
#
# Copy the custom splash screens and LauncherActivity over the ones Bubblewrap generates.
# Run after `bubblewrap update`, before `bubblewrap build`.
#
# The masters in splash/ were rendered from public/logo.svg with the mark at
# 36.5625% of the canvas width. Bubblewrap's own splash fills the canvas with the
# whole icon, which puts the mark at 56.25% and reads as oversized on launch.

set -eu

cd "$(dirname "$0")"

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    source_file="splash/drawable-$density/splash.png"
    target_file="app/src/main/res/drawable-$density/splash.png"

    [ -f "$source_file" ] || { echo "missing $source_file" >&2; exit 1; }
    [ -d "$(dirname "$target_file")" ] || { echo "missing $(dirname "$target_file")" >&2; exit 1; }

    cp "$source_file" "$target_file"
done

# Bubblewrap's LauncherActivity leaves the library's "Site settings" shortcut in the launcher's
# long-press menu. Ours removes it.
launcher_target="app/src/main/java/app/cozybooks/pinya/LauncherActivity.java"
[ -f launcher/LauncherActivity.java ] || { echo "missing launcher/LauncherActivity.java" >&2; exit 1; }
[ -d "$(dirname "$launcher_target")" ] || { echo "missing $(dirname "$launcher_target")" >&2; exit 1; }
cp launcher/LauncherActivity.java "$launcher_target"

echo "Splash screens and LauncherActivity restored."
