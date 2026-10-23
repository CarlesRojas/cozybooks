package app.cozybooks.pinya.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.text.TextPaint;
import android.util.LruCache;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import app.cozybooks.pinya.R;

/**
 * Draws a whole book card into one bitmap: the app's BookCover, i.e. the cover
 * center-cropped with rounded corners and a hairline border, or, with no cover, the book
 * icon over the title and first author on a plain card.
 *
 * Everything is composited here so a grid cell can be a single ImageView: widget cells
 * are inflated and bound by the launcher on its UI thread every time a row appears, and
 * each extra view in the cell layout costs inflation time.
 *
 * Finished cards live in an LruCache keyed by cover, size, state and light/dark, which
 * both keeps repeated builds instant and holds a strong reference to every bitmap the
 * launcher is showing, so nothing is collected and reloaded mid-scroll.
 */
final class WidgetCardRenderer {
    // BookCover's `rounded-[22px]` on a cover about 172px wide, the size the app shows it
    // at on a phone.
    private static final float REFERENCE_WIDTH = 172f;
    private static final float CORNER_RATIO = 22f / REFERENCE_WIDTH;

    // Cards are drawn at the size they are displayed, so the launcher never scales them.
    private static final int CACHE_BYTES = 12 * 1024 * 1024;

    private static final LruCache<String, Bitmap> CACHE = new LruCache<String, Bitmap>(CACHE_BYTES) {
        @Override
        protected int sizeOf(String key, Bitmap value) {
            return value.getByteCount();
        }
    };

    // The app's neutral palette, light then dark: the page under the card (the corners
    // are drawn over it, since RGB_565 cards carry no transparency), the empty card, its
    // border, the text on it, and the skeleton's fill and border.
    private static final class Palette {
        final int background;
        final int card;
        final int border;
        final int text;
        final int skeleton;
        final int skeletonBorder;

        Palette(boolean night) {
            background = night ? 0xFF0A0A0A : 0xFFFAFAFA; // neutral-950 / neutral-50
            card = night ? 0xFF1B1B1B : 0xFFF1F1F1; // neutral-850 / neutral-150
            border = night ? 0x66737373 : 0x40737373; // neutral-500/40 / neutral-500/25
            text = night ? 0xFFFAFAFA : 0xFF0A0A0A;
            skeleton = night ? 0xFF171717 : 0xFFE5E5E5; // neutral-900 / neutral-200
            skeletonBorder = night ? 0xFF404040 : 0xFFD4D4D4; // neutral-700 / neutral-300
        }
    }

    private WidgetCardRenderer() {}

    /** The card for one book, from the cache when possible. */
    static Bitmap card(Context context, String coverUrl, String title, String author, int widthPx, int heightPx) {
        boolean night = WidgetRenderer.isNight(context);
        String key = widthPx + "x" + heightPx + "|" + night + "|" + (coverUrl == null ? title + "|" + author : coverUrl);

        Bitmap cached = CACHE.get(key);
        if (cached != null && !cached.isRecycled()) return cached;

        boolean hasCover = coverUrl != null && !coverUrl.isEmpty() && WidgetApi.cachedCover(context, coverUrl) != null;

        Bitmap card = draw(context, night, hasCover ? coverUrl : null, title, author, false, widthPx, heightPx);

        // A card drawn while its cover was still downloading shows the title fallback, so
        // it must not be cached under the cover's key - the next render, once the file
        // has landed, has to draw the real cover.
        boolean expectingCover = coverUrl != null && !coverUrl.isEmpty() && !hasCover;
        if (card != null && !expectingCover) CACHE.put(key, card);

        return card;
    }

    /** The app's skeleton card, behind cells whose shelf hasn't arrived yet. */
    static Bitmap placeholder(Context context, int widthPx, int heightPx) {
        boolean night = WidgetRenderer.isNight(context);
        String key = widthPx + "x" + heightPx + "|" + night + "|skeleton";

        Bitmap cached = CACHE.get(key);
        if (cached != null && !cached.isRecycled()) return cached;

        Bitmap card = draw(context, night, null, null, null, true, widthPx, heightPx);
        if (card != null) CACHE.put(key, card);
        return card;
    }

    private static Bitmap draw(Context context, boolean night, String coverUrl, String title, String author,
            boolean skeleton, int widthPx, int heightPx) {
        if (widthPx <= 0 || heightPx <= 0) return null;

        Palette palette = new Palette(night);

        // RGB_565 halves the memory of every card, and nothing here needs transparency:
        // the rounded corners are drawn over the widget's background colour.
        Bitmap output = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.RGB_565);
        // Cards are drawn at their exact display size, so the ImageView must not rescale
        // them for the screen's density.
        output.setDensity(Bitmap.DENSITY_NONE);

        Canvas canvas = new Canvas(output);
        canvas.drawColor(palette.background);

        float scale = widthPx / REFERENCE_WIDTH;
        float radius = widthPx * CORNER_RATIO;
        float stroke = Math.max(1f, scale);
        RectF bounds = new RectF(0, 0, widthPx, heightPx);
        RectF borderBounds = new RectF(stroke / 2f, stroke / 2f, widthPx - stroke / 2f, heightPx - stroke / 2f);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        Bitmap cover = skeleton ? null : loadCover(context, coverUrl, widthPx, heightPx);

        if (cover != null) {
            float coverScale = Math.max((float) widthPx / cover.getWidth(), (float) heightPx / cover.getHeight());
            Matrix matrix = new Matrix();
            matrix.setScale(coverScale, coverScale);
            matrix.postTranslate((widthPx - cover.getWidth() * coverScale) / 2f,
                    (heightPx - cover.getHeight() * coverScale) / 2f);

            BitmapShader shader = new BitmapShader(cover, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
            shader.setLocalMatrix(matrix);
            paint.setShader(shader);
            canvas.drawRoundRect(bounds, radius, radius, paint);
            paint.setShader(null);

            cover.recycle();
        } else {
            paint.setColor(skeleton ? palette.skeleton : palette.card);
            canvas.drawRoundRect(bounds, radius, radius, paint);
        }

        // The cover's hairline border, drawn over the artwork as the app does.
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(stroke);
        paint.setColor(skeleton ? palette.skeletonBorder : palette.border);
        canvas.drawRoundRect(borderBounds, radius, radius, paint);
        paint.setStyle(Paint.Style.FILL);

        if (cover == null && !skeleton) drawFallback(context, canvas, palette, title, author, scale, widthPx, heightPx);

        return output;
    }

    // BookCover without a cover: the book icon, the title (bold, up to four lines) and the
    // first author (semibold at half opacity, up to two lines), centred as one block.
    private static void drawFallback(Context context, Canvas canvas, Palette palette, String title, String author,
            float scale, int widthPx, int heightPx) {
        float padding = 12f * scale;
        float maxWidth = widthPx - 2 * padding;

        TextPaint titlePaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        titlePaint.setColor(palette.text);
        titlePaint.setTextSize(16f * scale);
        titlePaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        titlePaint.setTextAlign(Paint.Align.CENTER);

        TextPaint authorPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        authorPaint.setColor((palette.text & 0x00FFFFFF) | 0x80000000);
        authorPaint.setTextSize(14f * scale);
        authorPaint.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        authorPaint.setTextAlign(Paint.Align.CENTER);

        List<String> titleLines = title == null ? new ArrayList<>() : wrap(title, titlePaint, maxWidth, 4);
        List<String> authorLines = author == null ? new ArrayList<>() : wrap(author, authorPaint, maxWidth, 2);

        float iconSize = 32f * scale;
        float iconGap = 12f * scale;
        float titleLine = titlePaint.getTextSize() * 1.375f;
        float authorLine = authorPaint.getTextSize() * 1.375f;
        float gap = 4f * scale;

        float blockHeight = iconSize + iconGap + titleLines.size() * titleLine
                + (authorLines.isEmpty() ? 0 : gap + authorLines.size() * authorLine);
        float y = Math.max(padding, (heightPx - blockHeight) / 2f);

        Drawable icon = context.getDrawable(R.drawable.ic_widget_book);
        if (icon != null) {
            icon = icon.mutate();
            icon.setTint(palette.text);
            int left = Math.round((widthPx - iconSize) / 2f);
            int top = Math.round(y);
            icon.setBounds(left, top, left + Math.round(iconSize), top + Math.round(iconSize));
            icon.draw(canvas);
        }
        y += iconSize + iconGap;

        for (String line : titleLines) {
            canvas.drawText(line, widthPx / 2f, y + titlePaint.getTextSize(), titlePaint);
            y += titleLine;
        }

        if (!authorLines.isEmpty()) y += gap;
        for (String line : authorLines) {
            canvas.drawText(line, widthPx / 2f, y + authorPaint.getTextSize(), authorPaint);
            y += authorLine;
        }
    }

    // Word wrap by hand, with an ellipsis on the last line when the text runs over:
    // StaticLayout would need a per-API-level constructor dance for a few lines of text.
    private static List<String> wrap(String text, TextPaint paint, float maxWidth, int maxLines) {
        List<String> lines = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        String[] words = text.trim().split("\\s+");
        boolean truncated = false;

        for (int i = 0; i < words.length; i++) {
            String candidate = line.length() == 0 ? words[i] : line + " " + words[i];
            if (paint.measureText(candidate) <= maxWidth || line.length() == 0) {
                line.setLength(0);
                line.append(candidate);
            } else {
                lines.add(line.toString());
                line.setLength(0);
                line.append(words[i]);
                if (lines.size() == maxLines) {
                    truncated = true;
                    break;
                }
            }
        }
        if (!truncated && line.length() > 0) lines.add(line.toString());

        if (truncated) {
            int last = lines.size() - 1;
            lines.set(last, ellipsize(lines.get(last) + "…", paint, maxWidth));
        } else if (!lines.isEmpty()) {
            int last = lines.size() - 1;
            if (paint.measureText(lines.get(last)) > maxWidth) lines.set(last, ellipsize(lines.get(last), paint, maxWidth));
        }

        return lines;
    }

    private static String ellipsize(String text, TextPaint paint, float maxWidth) {
        String base = text.endsWith("…") ? text.substring(0, text.length() - 1) : text;
        while (base.length() > 1 && paint.measureText(base + "…") > maxWidth) base = base.substring(0, base.length() - 1);
        return base.trim() + "…";
    }

    /** Decodes the downloaded cover, subsampled to roughly the size it is drawn at. */
    private static Bitmap loadCover(Context context, String coverUrl, int widthPx, int heightPx) {
        if (context == null || coverUrl == null || coverUrl.isEmpty()) return null;

        File file = WidgetApi.cachedCover(context, coverUrl);
        if (file == null) return null;

        try {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(file.getAbsolutePath(), bounds);

            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inSampleSize = 1;
            while (bounds.outWidth / (options.inSampleSize * 2) >= widthPx
                    && bounds.outHeight / (options.inSampleSize * 2) >= heightPx)
                options.inSampleSize *= 2;

            return BitmapFactory.decodeFile(file.getAbsolutePath(), options);
        } catch (Exception e) {
            return null;
        }
    }
}
