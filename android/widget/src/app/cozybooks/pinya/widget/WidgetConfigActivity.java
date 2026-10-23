package app.cozybooks.pinya.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * The widget's configuration screen: pick which shelf the widget shows. Built
 * programmatically in the app's palette, light or dark with the phone, so no layout
 * resources beyond the widget's own are needed.
 */
public class WidgetConfigActivity extends Activity {
    // key, title
    private static final String[][] SECTIONS = {
            { "reading", "Reading" },
            { "to-read", "Want to read" },
            { WidgetPrefs.SHELVES_READING, "Reading & Want to read" },
            { "finished-year", "Finished this year" },
    };

    // The brand colour the app's checked options are filled with.
    private static final int COLOR_BRAND = 0xFF9E4CE0;

    private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    private boolean night;
    private int colorBackground;
    private int colorText;
    private int colorMuted;
    private int colorRow;
    private int colorRowBorder;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bundle extras = getIntent().getExtras();
        if (extras != null)
            widgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);

        setResult(RESULT_CANCELED, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId));

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        night = WidgetRenderer.isNight(this);
        colorBackground = night ? 0xFF0A0A0A : 0xFFFAFAFA; // neutral-950 / neutral-50
        colorText = night ? 0xFFFAFAFA : 0xFF0A0A0A;
        colorMuted = night ? 0x99FAFAFA : 0x990A0A0A; // the app's opacity-60
        colorRow = night ? 0xFF1B1B1B : 0xFFF1F1F1; // neutral-850 / neutral-150
        colorRowBorder = night ? 0x66737373 : 0x40737373; // neutral-500/40 / neutral-500/25

        setContentView(buildContent());
        tintSystemBars();
    }

    private View buildContent() {
        float density = getResources().getDisplayMetrics().density;
        int pad = Math.round(24 * density);

        final LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText("Choose a shelf");
        title.setTextColor(colorText);
        title.setTextSize(24);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        column.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("The widget shows its books, newest first. Reading & Want to read gets a toggle to switch between the two.");
        subtitle.setTextColor(colorMuted);
        subtitle.setTextSize(15);
        subtitle.setPadding(0, Math.round(8 * density), 0, Math.round(20 * density));
        column.addView(subtitle);

        // A new widget has nothing highlighted, so tapping a shelf reads as the way to
        // pick it. Reconfiguring one highlights the shelf it already shows.
        String current = WidgetPrefs.hasSection(this, widgetId) ? WidgetPrefs.getSection(this, widgetId) : null;

        for (String[] section : SECTIONS) {
            final String key = section[0];
            column.addView(buildRow(density, section[1], key.equals(current), v -> select(key)));
        }

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(colorBackground);
        scroll.setFillViewport(true);
        scroll.addView(column);

        // The activity draws edge to edge (enforced when targeting Android 15+), so pad
        // the content out of the status and navigation bars.
        scroll.setOnApplyWindowInsetsListener((view, insets) -> {
            int top;
            int bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                top = bars.top;
                bottom = bars.bottom;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
            }

            column.setPadding(pad, pad + top, pad, pad + bottom);
            return insets;
        });

        return scroll;
    }

    // The app's options: a neutral pill with a hairline border, filled with the brand
    // colour once checked.
    private View buildRow(float density, String title, boolean selected, View.OnClickListener onClick) {
        TextView row = new TextView(this);
        row.setText(title);
        row.setTextColor(selected ? 0xFFFAFAFA : colorText);
        row.setTextSize(16);
        row.setTypeface(Typeface.create("sans-serif-medium", selected ? Typeface.BOLD : Typeface.NORMAL));
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(Math.round(20 * density), Math.round(14 * density), Math.round(20 * density),
                Math.round(14 * density));

        GradientDrawable background = new GradientDrawable();
        background.setColor(selected ? COLOR_BRAND : colorRow);
        background.setCornerRadius(999 * density);
        background.setStroke(Math.max(1, Math.round(density)), selected ? COLOR_BRAND : colorRowBorder);
        row.setBackground(background);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.bottomMargin = Math.round(10 * density);
        row.setLayoutParams(params);

        row.setOnClickListener(onClick);

        return row;
    }

    // Dark status and navigation bar icons on the light page, light ones on the dark page.
    private void tintSystemBars() {
        // Below Android 15 the bars are opaque, so they take the page colour too. Ignored
        // from Android 15 on, where the page already draws under them.
        getWindow().setStatusBarColor(colorBackground);
        getWindow().setNavigationBarColor(colorBackground);

        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller == null) return;

            int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            controller.setSystemBarsAppearance(night ? 0 : light, light);
        } else if (Build.VERSION.SDK_INT >= 26 && !night) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
    }

    private void select(String section) {
        WidgetPrefs.setSection(this, widgetId, section);

        // The system skips the initial onUpdate when a configuration activity is set, so
        // trigger the first render (and data fetch) ourselves.
        BookshelfWidgetProvider.requestRefresh(this);

        setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId));
        finish();
    }
}
