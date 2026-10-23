package app.cozybooks.pinya.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import java.util.List;

import app.cozybooks.pinya.R;

/**
 * Builds the RemoteViews shell of one widget instance: the header (the shelf's title, plus
 * the Reading/Want to read toggle when the widget shows both), the vertically scrolling
 * cover grid, and the message shown when there is nothing to render. The grid
 * shows 1, 2 or 3 covers per row depending on the width the widget was given;
 * GridView.setNumColumns is not remotable, so the count is picked by choosing between
 * three otherwise identical layouts.
 *
 * Colours come from widget_colors.xml, which has a night variant, so the shell follows the
 * phone's light or dark mode. The widget can't see the theme picked inside the app.
 */
public final class WidgetRenderer {
    public static final String SITE_URL = "https://www.cozybooks.app";

    // Covers are 13:20, the app's `aspect-book`.
    public static final int COVER_WIDTH = 13;
    public static final int COVER_HEIGHT = 20;

    private WidgetRenderer() {}

    public static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        android.util.Log.d(WidgetLog.TAG, "updateWidget widget=" + widgetId);

        String section = WidgetPrefs.getShown(context, widgetId);

        RemoteViews views = new RemoteViews(context.getPackageName(), gridLayout(manager, widgetId));

        // Only the Reading & Want to read choice carries the toggle; a single shelf pins
        // the widget and the toggle would be dead weight.
        if (WidgetPrefs.getSection(context, widgetId).equals(WidgetPrefs.SHELVES_READING)) {
            views.setViewVisibility(R.id.widget_toggle, View.VISIBLE);
            renderToggle(context, views, widgetId, section);
        } else {
            views.setViewVisibility(R.id.widget_toggle, View.GONE);
        }

        views.setTextViewText(R.id.widget_title, sectionTitle(section));
        views.setOnClickPendingIntent(R.id.widget_title,
                openAppIntent(context, SITE_URL + sectionPage(section), requestCode(widgetId, 2)));

        boolean connected = WidgetPrefs.isConnected(context) && !WidgetPrefs.isTokenRejected(context);

        if (!connected) {
            // The app's primary button instead of a bare instruction; it opens the widget
            // page, where access is granted. The grid is hidden explicitly - the launcher
            // keeps its previously bound cells otherwise, and revoked access must not
            // keep showing covers.
            views.setViewVisibility(R.id.widget_grid, View.GONE);
            views.setViewVisibility(R.id.widget_connect, View.VISIBLE);
            views.setViewVisibility(R.id.widget_message, View.GONE);
            views.setOnClickPendingIntent(R.id.widget_connect,
                    openAppIntent(context, SITE_URL + "/widget", requestCode(widgetId, 3)));
            manager.updateAppWidget(widgetId, views);
            return;
        }

        views.setViewVisibility(R.id.widget_grid, View.VISIBLE);
        views.setViewVisibility(R.id.widget_connect, View.GONE);

        // The grid's empty view; while the payload is missing the grid is filled with
        // empty cards instead, so this only shows for a genuinely empty shelf.
        views.setTextViewText(R.id.widget_message, context.getString(R.string.widgetEmptyMessage));
        views.setOnClickPendingIntent(R.id.widget_message,
                openAppIntent(context, SITE_URL + sectionPage(section), requestCode(widgetId, 4)));

        attachCells(context, manager, views, widgetId);
        views.setEmptyView(R.id.widget_grid, R.id.widget_message);

        // One template for every cell tap; cells fill in the book url to open. It has to
        // stay mutable so the launcher can apply the fill-ins.
        Intent template = new Intent(context, WidgetActionActivity.class)
                .setData(Uri.parse("cozybooks://widget-action/" + widgetId));
        views.setPendingIntentTemplate(R.id.widget_grid,
                PendingIntent.getActivity(context, widgetId, template, mutableFlags()));

        manager.updateAppWidget(widgetId, views);
    }

    /**
     * Hands the launcher the entire shelf in one go on Android 12+
     * (RemoteCollectionItems), so scrolling needs no adapter connection and loads nothing.
     * Older releases fall back to the legacy RemoteViewsService adapter.
     */
    private static void attachCells(Context context, AppWidgetManager manager, RemoteViews views, int widgetId) {
        if (Build.VERSION.SDK_INT < 31) {
            Intent adapter = new Intent(context, WidgetGridService.class)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                    // Launchers cache adapter connections by filterEquals, which ignores
                    // extras; the widget id in the data URI keeps instances separate.
                    .setData(Uri.parse("cozybooks://widget-grid/" + widgetId));

            views.setRemoteAdapter(R.id.widget_grid, adapter);
            return;
        }

        List<RemoteViews> cells = WidgetCells.build(context, manager, widgetId);

        RemoteViews.RemoteCollectionItems.Builder builder = new RemoteViews.RemoteCollectionItems.Builder()
                .setHasStableIds(true)
                // Every cell is the same one-ImageView layout, so the launcher can
                // recycle any row into any other without re-inflating.
                .setViewTypeCount(1);

        for (int i = 0; i < cells.size(); i++) builder.addItem(i, cells.get(i));

        views.setRemoteAdapter(R.id.widget_grid, builder.build());
    }

    public static boolean isNight(Context context) {
        int mode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return mode == Configuration.UI_MODE_NIGHT_YES;
    }

    public static int widgetWidthDp(AppWidgetManager manager, int widgetId) {
        Bundle options = manager.getAppWidgetOptions(widgetId);
        int minWidthDp = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH) : 0;
        return minWidthDp > 0 ? minWidthDp : 250; // a typical 4-cell widget when unknown
    }

    // 2 launcher cells wide (or less) shows one cover per row, 3 cells shows two, 4 and
    // up shows three. The reported width maps back to cells with the platform's sizing
    // formula (n cells make 70n-30dp available).
    public static int columnsFor(AppWidgetManager manager, int widgetId) {
        int cells = (widgetWidthDp(manager, widgetId) + 30) / 70;

        if (cells <= 2) return 1;
        if (cells == 3) return 2;
        return 3;
    }

    /**
     * The pixel width of one grid cell: the widget's width minus the root's side padding
     * and the grid's spacing, split between the columns. Cards are drawn at exactly this
     * size so the launcher never scales or re-measures them while scrolling.
     */
    public static int cellWidthPx(Context context, AppWidgetManager manager, int widgetId) {
        int columns = columnsFor(manager, widgetId);
        // The root's 12dp of side padding, the grid's 8dp between columns, and 2dp of
        // slack so a launcher whose column is a hair narrower cannot clip the card.
        int innerWidthDp = widgetWidthDp(manager, widgetId) - 24 - 2;
        int columnWidthDp = (innerWidthDp - 8 * (columns - 1)) / columns;

        int widthPx = Math.round(columnWidthDp * context.getResources().getDisplayMetrics().density);

        // Guard against a launcher reporting a nonsense width before the first layout,
        // and keep a dozen cards well inside the memory a widget update may carry.
        return Math.max(120, Math.min(widthPx, 360));
    }

    public static int cellHeightPx(int widthPx) {
        return widthPx * COVER_HEIGHT / COVER_WIDTH;
    }

    private static int gridLayout(AppWidgetManager manager, int widgetId) {
        switch (columnsFor(manager, widgetId)) {
            case 1: return R.layout.widget_shelf_1col;
            case 2: return R.layout.widget_shelf_2col;
            default: return R.layout.widget_shelf_3col;
        }
    }

    // The app's checked option: the shelf on show is filled with the brand colour, its
    // icon in white; the other icon keeps the glass pill's text colour.
    private static void renderToggle(Context context, RemoteViews views, int widgetId, String shown) {
        boolean reading = !shown.equals("to-read");
        int idle = context.getColor(R.color.widget_toggle_icon);
        int checked = 0xFFFAFAFA;

        views.setInt(R.id.toggle_reading_wrap, "setBackgroundResource", reading ? R.drawable.widget_toggle_selected : 0);
        views.setInt(R.id.toggle_to_read_wrap, "setBackgroundResource", reading ? 0 : R.drawable.widget_toggle_selected);
        views.setInt(R.id.toggle_reading, "setColorFilter", reading ? checked : idle);
        views.setInt(R.id.toggle_to_read, "setColorFilter", reading ? idle : checked);

        views.setOnClickPendingIntent(R.id.toggle_reading_wrap, setShelfIntent(context, widgetId, "reading"));
        views.setOnClickPendingIntent(R.id.toggle_to_read_wrap, setShelfIntent(context, widgetId, "to-read"));
    }

    private static PendingIntent setShelfIntent(Context context, int widgetId, String shelf) {
        Intent intent = new Intent(context, BookshelfWidgetProvider.class)
                .setAction(BookshelfWidgetProvider.ACTION_SET_SHELF)
                .setData(Uri.parse("cozybooks://widget/" + widgetId + "/shelf/" + shelf))
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                .putExtra(BookshelfWidgetProvider.EXTRA_SHELF, shelf);

        return PendingIntent.getBroadcast(context, requestCode(widgetId, shelf.equals("reading") ? 5 : 6), intent,
                immutableFlags());
    }

    /** Opens the TWA on the given URL, e.g. a book's page or a shelf. */
    private static PendingIntent openAppIntent(Context context, String url, int code) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url))
                .setPackage(context.getPackageName())
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        return PendingIntent.getActivity(context, code, intent, immutableFlags());
    }

    private static int requestCode(int widgetId, int kind) {
        return widgetId * 10 + kind;
    }

    private static int immutableFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return flags;
    }

    private static int mutableFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
        return flags;
    }

    /** The shelves' titles; the payload carries the same strings. */
    public static String sectionTitle(String key) {
        switch (key) {
            case "to-read": return "Want to read";
            case "finished-year": return "Finished this year";
            default: return "Reading";
        }
    }

    /** The app page a shelf lives on, for the title's tap target. */
    private static String sectionPage(String key) {
        return key.equals("finished-year") ? "/finished" : "/reading";
    }
}
