CREATE TABLE IF NOT EXISTS "unreleasedBook" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unreleasedBook" ADD CONSTRAINT "unreleasedBook_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
