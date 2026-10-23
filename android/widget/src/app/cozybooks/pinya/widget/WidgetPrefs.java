package app.cozybooks.pinya.widget;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * All widget state: the pairing credentials handed over by the web app through the
 * cozybooks://widget-setup deep link, the shelf each widget shows, and the last sections
 * payload so the widget can paint instantly (and offline) before a network refresh lands.
 */
public final class WidgetPrefs {
    private static final String FILE = "cozybooks_widget";

    private WidgetPrefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    // --- Pairing -----------------------------------------------------------------------

    public static void saveCredentials(Context context, String token, String apiBase) {
        prefs(context).edit()
                .putString("token", token)
                .putString("apiBase", apiBase)
                .putBoolean("tokenRejected", false)
                .apply();
    }

    public static String getToken(Context context) {
        return prefs(context).getString("token", null);
    }

    public static String getApiBase(Context context) {
        return prefs(context).getString("apiBase", null);
    }

    public static boolean isConnected(Context context) {
        return getToken(context) != null && getApiBase(context) != null;
    }

    /** Set when the backend answers 401, i.e. the token was revoked from the widget page. */
    public static void setTokenRejected(Context context, boolean rejected) {
        prefs(context).edit().putBoolean("tokenRejected", rejected).apply();
    }

    public static boolean isTokenRejected(Context context) {
        return prefs(context).getBoolean("tokenRejected", false);
    }

    // --- Per-widget configuration ------------------------------------------------------

    public static void setSection(Context context, int widgetId, String section) {
        prefs(context).edit().putString("widget_" + widgetId + "_section", section).apply();
    }

    public static String getSection(Context context, int widgetId) {
        return prefs(context).getString("widget_" + widgetId + "_section", "reading");
    }

    // Whether a shelf was ever picked for this widget, as opposed to getSection falling
    // back to its default.
    public static boolean hasSection(Context context, int widgetId) {
        return prefs(context).contains("widget_" + widgetId + "_section");
    }

    public static void deleteWidget(Context context, int widgetId) {
        prefs(context).edit().remove("widget_" + widgetId + "_section").apply();
    }

    // --- Sections cache ----------------------------------------------------------------

    // One payload carries every shelf, so one cache serves every widget.

    public static void setCachedSections(Context context, String json) {
        prefs(context).edit()
                .putString("cache", json)
                .putLong("cache_at", System.currentTimeMillis())
                .apply();
    }

    public static String getCachedSections(Context context) {
        return prefs(context).getString("cache", null);
    }

    public static long getCachedSectionsAge(Context context) {
        long at = prefs(context).getLong("cache_at", 0);
        return at == 0 ? Long.MAX_VALUE : System.currentTimeMillis() - at;
    }

    /** Ages the payload out so the next render refetches. */
    public static void invalidateCache(Context context) {
        prefs(context).edit().remove("cache_at").apply();
    }

    /** Drops the payload entirely; a revoked token must not keep showing covers. */
    public static void clearCachedSections(Context context) {
        prefs(context).edit().remove("cache").remove("cache_at").apply();
    }
}
