CREATE TABLE IF NOT EXISTS "rating" (
    "userId" integer NOT NULL,
    "bookId" text NOT NULL,
    "rating" integer NOT NULL,
    CONSTRAINT "rating_userId_bookId_pk" PRIMARY KEY ("userId", "bookId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating" ADD CONSTRAINT "rating_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating" ADD CONSTRAINT "rating_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;