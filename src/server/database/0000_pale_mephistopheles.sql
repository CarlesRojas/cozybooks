CREATE TABLE IF NOT EXISTS "book" (
	"index" text PRIMARY KEY NOT NULL,
	"title" text,
	"authors" text[],
	"publisher" text,
	"publishedDate" timestamp,
	"description" text,
	"pageCount" integer,
	"categories" text[],
	"mainCategory" text,
	"averageRating" real,
	"ratingsCount" integer,
	"language" text,
	"previewLink" text,
	"smallThumbnail" text,
	"thumbnail" text,
	"small" text,
	"medium" text,
	"large" text,
	"extraLarge" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finished" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"bookId" text NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library" (
	"userId" integer NOT NULL,
	"bookId" text NOT NULL,
	"type" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "library_userId_type_bookId_pk" PRIMARY KEY("userId","type","bookId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "finished" ADD CONSTRAINT "finished_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "finished" ADD CONSTRAINT "finished_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "library" ADD CONSTRAINT "library_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "library" ADD CONSTRAINT "library_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailUniqueIndex" ON "user" USING btree (lower("email"));