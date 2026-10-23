package app.cozybooks.pinya.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Calendar;

/**
 * Plain-framework networking for the widget (HttpURLConnection + org.json), so no
 * dependency has to be patched into the Bubblewrap-generated build.gradle. Also owns the
 * on-disk cover cache; WidgetCardRenderer turns those files into the cards the grid
 * shows.
 */
public final class WidgetApi {
    private static final String COVER_DIR = "widget_covers";

    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 8000;

    private WidgetApi() {}

    /**
     * GET /widget/sections with this year's bounds in the phone's time zone, which is how
     * the app decides what was finished this year. Returns the JSON payload, or null on
     * failure.
     */
    public static String fetchSections(Context context) {
        String apiBase = WidgetPrefs.getApiBase(context);
        if (apiBase == null) return null;

        String token = WidgetPrefs.getToken(context);
        if (token == null) return null;

        Calendar start = Calendar.getInstance();
        start.set(start.get(Calendar.YEAR), Calendar.JANUARY, 1, 0, 0, 0);
        start.set(Calendar.MILLISECOND, 0);
        Calendar end = (Calendar) start.clone();
        end.add(Calendar.YEAR, 1);

        HttpURLConnection connection = null;
        try {
            URL url = new URL(apiBase + "/widget/sections?yearStart=" + start.getTimeInMillis()
                    + "&yearEnd=" + end.getTimeInMillis());
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setRequestProperty("Authorization", "Bearer " + token);

            int status = connection.getResponseCode();

            if (status == 401) {
                // The token was revoked from the widget page: remember it so the widget
                // can show its reconnect state, and drop the cached payload so no covers
                // survive the revocation.
                WidgetPrefs.setTokenRejected(context, true);
                WidgetPrefs.clearCachedSections(context);
                return null;
            }

            if (status != 200) return null;

            WidgetPrefs.setTokenRejected(context, false);

            BufferedReader reader =
                    new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
            reader.close();

            return body.toString();
        } catch (Exception e) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    // --- Covers ------------------------------------------------------------------------

    /**
     * Download the covers of the given sections, so building cells only reads local
     * files. Limited to the shelves some widget actually displays; the others fill in
     * when a widget is reconfigured to them.
     */
    public static void prefetchCovers(Context context, String sectionsJson, java.util.Set<String> sectionKeys) {
        try {
            JSONArray sections = new JSONObject(sectionsJson).getJSONArray("sections");
            for (int s = 0; s < sections.length(); s++) {
                JSONObject section = sections.getJSONObject(s);
                if (sectionKeys != null && !sectionKeys.contains(section.getString("key"))) continue;

                JSONArray items = section.getJSONArray("items");
                for (int i = 0; i < items.length(); i++) {
                    String url = items.getJSONObject(i).optString("coverUrl", "");
                    if (!url.isEmpty() && !url.equals("null")) downloadCover(context, url);
                }
            }
        } catch (Exception ignored) {
        }
    }

    /**
     * The cached file for a cover URL, or null when it has not been downloaded yet.
     * Deliberately never hits the network: cards are drawn wherever a widget is rendered,
     * and only prefetchCovers (which the provider runs in the background) downloads.
     */
    static File cachedCover(Context context, String url) {
        try {
            File file = coverFile(context, url);
            return file != null && file.exists() && file.length() > 0 ? file : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static void downloadCover(Context context, String url) {
        try {
            File file = coverFile(context, url);
            if (file == null || (file.exists() && file.length() > 0)) return;

            Bitmap source = download(url);
            if (source == null) return;

            writeJpeg(file, source);
            source.recycle();
        } catch (Exception ignored) {
        }
    }

    private static File coverFile(Context context, String url) throws Exception {
        File dir = new File(context.getCacheDir(), COVER_DIR);
        if (!dir.exists() && !dir.mkdirs()) return null;

        return new File(dir, sha1(url) + ".jpg");
    }

    private static Bitmap download(String url) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);

            if (connection.getResponseCode() != 200) return null;

            InputStream in = connection.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(in);
            in.close();
            return bitmap;
        } catch (Exception e) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static boolean writeJpeg(File file, Bitmap bitmap) {
        try {
            File temp = new File(file.getParentFile(), file.getName() + ".tmp");
            FileOutputStream out = new FileOutputStream(temp);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.close();
            return temp.renameTo(file) || file.exists();
        } catch (Exception e) {
            return false;
        }
    }

    private static String sha1(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) hex.append(String.format("%02x", b));
        return hex.toString();
    }
}
