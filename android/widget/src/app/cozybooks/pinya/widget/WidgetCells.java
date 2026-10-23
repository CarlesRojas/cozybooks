package app.cozybooks.pinya.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.util.Log;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import app.cozybooks.pinya.R;

/**
 * Builds every cell of one widget's grid from the cached payload - the whole shelf at
 * once, each cell a single ImageView carrying its finished card bitmap. Whoever attaches
 * them (RemoteCollectionItems on Android 12+, the legacy factory below it) therefore
 * hands the launcher everything up front, and scrolling loads nothing.
 */
final class WidgetCells {
    private static final int SKELETON_CELLS = 6;

    private WidgetCells() {}

    static List<RemoteViews> build(Context context, AppWidgetManager manager, int widgetId) {
        long start = System.currentTimeMillis();

        int widthPx = WidgetRenderer.cellWidthPx(context, manager, widgetId);
        int heightPx = WidgetRenderer.cellHeightPx(widthPx);

        List<RemoteViews> cells = new ArrayList<>();

        String json = WidgetPrefs.getCachedSections(context);

        if (json == null) {
            // No payload yet (first placement): empty cards until the provider's fetch
            // lands.
            for (int i = 0; i < SKELETON_CELLS; i++) cells.add(skeletonCell(context, widthPx, heightPx));
        } else {
            try {
                JSONArray items = itemsOf(json, WidgetPrefs.getSection(context, widgetId));

                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);

                    String coverUrl = item.isNull("coverUrl") ? null : item.optString("coverUrl", null);
                    String author = item.isNull("author") ? null : item.optString("author", null);

                    Bitmap card = WidgetCardRenderer.card(context, coverUrl, item.optString("title", ""), author,
                            widthPx, heightPx);

                    RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_item);
                    cell.setImageViewBitmap(R.id.item_root, card);
                    cell.setContentDescription(R.id.item_root, item.optString("title", ""));
                    cell.setOnClickFillInIntent(R.id.item_root,
                            new Intent().putExtra(BookshelfWidgetProvider.EXTRA_URL, item.getString("appUrl")));

                    cells.add(cell);
                }
            } catch (Exception ignored) {
            }
        }

        Log.d(WidgetLog.TAG, "buildCells widget=" + widgetId + " payload=" + (json != null)
                + " cells=" + cells.size() + " card=" + widthPx + "x" + heightPx
                + " took=" + (System.currentTimeMillis() - start) + "ms");

        return cells;
    }

    static RemoteViews skeletonCell(Context context, int widthPx, int heightPx) {
        RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_item);
        cell.setImageViewBitmap(R.id.item_root, WidgetCardRenderer.placeholder(context, widthPx, heightPx));
        return cell;
    }

    private static JSONArray itemsOf(String json, String sectionKey) throws Exception {
        JSONArray sections = new JSONObject(json).getJSONArray("sections");

        for (int i = 0; i < sections.length(); i++)
            if (sections.getJSONObject(i).getString("key").equals(sectionKey))
                return sections.getJSONObject(i).getJSONArray("items");

        return sections.getJSONObject(0).getJSONArray("items");
    }
}
