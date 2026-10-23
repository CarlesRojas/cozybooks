/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package app.cozybooks.pinya;

import android.content.pm.ActivityInfo;
import android.content.pm.ShortcutManager;
import android.os.Build;
import android.os.Bundle;

import java.util.Collections;

import com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity;

// Master copy. `bubblewrap update` regenerates app/ from its template, so apply-splash.sh copies
// this file over the generated LauncherActivity on every release. Edit it here, not in app/.
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    @Override
    protected void launchTwa() {
        super.launchTwa();
        // The library adds a "Site settings" shortcut on every launch, which shows first in the
        // launcher's long-press menu. Remove it right after. Turning off enableSiteSettingsShortcut
        // in twa-manifest.json instead drops ManageDataLauncherActivity from the manifest, which
        // the library still tries to enable on launch.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            ShortcutManager shortcutManager = getSystemService(ShortcutManager.class);
            if (shortcutManager != null) {
                shortcutManager.removeDynamicShortcuts(
                        Collections.singletonList(ManageDataLauncherActivity.SITE_SETTINGS_SHORTCUT_ID));
            }
        }
    }
}
