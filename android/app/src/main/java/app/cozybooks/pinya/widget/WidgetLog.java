package app.cozybooks.pinya.widget;

/**
 * One logcat tag for every widget code path, so a session can be captured with
 * `adb logcat -v time -s CozyBooksWidget:D`.
 */
final class WidgetLog {
    static final String TAG = "CozyBooksWidget";

    private WidgetLog() {}
}
