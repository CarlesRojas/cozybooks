package app.cozybooks.pinya.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The CozyBooks shelf widget. The provider paints the RemoteViews shell and owns ALL
 * networking, so the widget's traffic is easy to reason about: one sections fetch, only
 * when the cache is older than STALE_AFTER_MS, on launcher updates (every
 * updatePeriodMillis) or a pairing/config refresh. Rendering and fetching both run on the
 * executor: cards are built from the cover cache on disk, which must not happen on the
 * main thread either.
 */
public class BookshelfWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH = "app.cozybooks.pinya.widget.REFRESH";
    public static final String ACTION_SET_SHELF = "app.cozybooks.pinya.widget.SET_SHELF";

    public static final String EXTRA_URL = "url";
    public static final String EXTRA_SHELF = "shelf";

    // Shelves change a few times a week, and the app's open/close refresh catches the
    // changes made in it anyway.
    private static final long STALE_AFTER_MS = 10 * 60 * 1000;

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(WidgetLog.TAG, "provider onReceive " + action);

        if (ACTION_SET_SHELF.equals(action)) {
            int widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,
                    AppWidgetManager.INVALID_APPWIDGET_ID);
            String shelf = intent.getStringExtra(EXTRA_SHELF);

            if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID && shelf != null) {
                WidgetPrefs.setShown(context, widgetId, shelf);
                // Both shelves travel in the one payload, so the repaint needs no fetch.
                renderThenFetch(context, new int[] { widgetId });
            }
            return;
        }

        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            // An update leaves the launcher holding views built by the previous version,
            // whose layout and resource ids may no longer exist, and the system doesn't
            // reliably ask for new ones. Repaint every widget from the new code.
            renderThenFetch(context, allWidgetIds(context));
            return;
        }

        if (ACTION_REFRESH.equals(action)) {
            // Pairing and (re)configuration want fresh data: age the cache out so the
            // fetch below actually runs.
            WidgetPrefs.invalidateCache(context);
            renderThenFetch(context, allWidgetIds(context));
            return;
        }

        super.onReceive(context, intent);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        renderThenFetch(context, widgetIds);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int widgetId, Bundle newOptions) {
        // A resize changes the column count and the size the cards are drawn at, so the
        // cells are rebuilt - off the main thread, like every other render.
        renderThenFetch(context, new int[] { widgetId });
    }

    @Override
    public void onDeleted(Context context, int[] widgetIds) {
        for (int widgetId : widgetIds) WidgetPrefs.deleteWidget(context, widgetId);
    }

    /** Entry point for the config and pairing activities, which run outside a broadcast. */
    public static void requestRefresh(Context context) {
        context.sendBroadcast(new Intent(context, BookshelfWidgetProvider.class).setAction(ACTION_REFRESH));
    }

    /**
     * Repaints the widgets from the cache. On Android 12+ the cells travel inside the
     * update itself (RemoteCollectionItems), so there is nothing to poke; older
     * launchers need their legacy factories told the data changed.
     */
    private static void renderAndNotify(Context context, int[] widgetIds) {
        if (widgetIds == null || widgetIds.length == 0) return;

        Log.d(WidgetLog.TAG, "renderAndNotify widgets=" + Arrays.toString(widgetIds));

        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        for (int widgetId : widgetIds) WidgetRenderer.updateWidget(context, manager, widgetId);

        if (android.os.Build.VERSION.SDK_INT < 31)
            manager.notifyAppWidgetViewDataChanged(widgetIds, app.cozybooks.pinya.R.id.widget_grid);
    }

    /**
     * Paints the widgets from what is cached, then - the one network path - fetches the
     * sections when the cache has aged out, downloads the covers of the shelves on show
     * and repaints with them. All of it runs on the executor, inside goAsync()'s window.
     */
    private void renderThenFetch(Context context, int[] widgetIds) {
        if (widgetIds == null || widgetIds.length == 0) return;

        final Context app = context.getApplicationContext();
        final PendingResult result = goAsync();

        EXECUTOR.execute(() -> {
            try {
                renderAndNotify(app, widgetIds);

                if (!WidgetPrefs.isConnected(app)) return;
                if (WidgetPrefs.getCachedSectionsAge(app) <= STALE_AFTER_MS) return;

                Set<String> sectionsInUse = new HashSet<>();
                for (int widgetId : allWidgetIds(app)) {
                    String section = WidgetPrefs.getSection(app, widgetId);
                    if (section.equals(WidgetPrefs.SHELVES_READING)) {
                        sectionsInUse.add("reading");
                        sectionsInUse.add("to-read");
                    } else {
                        sectionsInUse.add(section);
                    }
                }

                long start = System.currentTimeMillis();
                String json = WidgetApi.fetchSections(app);
                Log.d(WidgetLog.TAG, "fetchSections ok=" + (json != null)
                        + " took=" + (System.currentTimeMillis() - start) + "ms");

                if (json != null) {
                    WidgetPrefs.setCachedSections(app, json);
                    WidgetApi.prefetchCovers(app, json, sectionsInUse);
                }

                if (json != null || WidgetPrefs.isTokenRejected(app)) renderAndNotify(app, widgetIds);
            } finally {
                result.finish();
            }
        });
    }

    private static int[] allWidgetIds(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        return manager.getAppWidgetIds(new ComponentName(context, BookshelfWidgetProvider.class));
    }
}
