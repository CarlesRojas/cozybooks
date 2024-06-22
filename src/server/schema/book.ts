import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const book = pgTable("book", {
    id: text("index").primaryKey(),

    title: text("title"),
    authors: text("authors").array(),
    publisher: text("publisher"),
    publishedDate: timestamp("publishedDate"),
    description: text("description"),
    pageCount: integer("pageCount"),
    categories: text("categories").array(),
    mainCategory: text("mainCategory"),
    averageRating: integer("averageRating"),
    ratingsCount: integer("ratingsCount"),
    language: text("language"),
    previewLink: text("previewLink"),

    smallThumbnail: text("smallThumbnail"),
    thumbnail: text("thumbnail"),
    small: text("small"),
    medium: text("medium"),
    large: text("large"),
    extraLarge: text("extraLarge"),
});
