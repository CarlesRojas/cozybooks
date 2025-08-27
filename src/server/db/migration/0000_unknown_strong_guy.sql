CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "book" (
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
CREATE TABLE "finished" (
	"id" serial PRIMARY KEY NOT NULL,
	"bookId" text NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library" (
	"userId" text NOT NULL,
	"bookId" text NOT NULL,
	"type" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "library_userId_type_bookId_pk" PRIMARY KEY("userId","type","bookId")
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"userId" text NOT NULL,
	"bookId" text NOT NULL,
	"rating" integer NOT NULL,
	CONSTRAINT "rating_userId_bookId_pk" PRIMARY KEY("userId","bookId")
);
--> statement-breakpoint
CREATE TABLE "unreleasedBook" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished" ADD CONSTRAINT "finished_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_bookId_book_index_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("index") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unreleasedBook" ADD CONSTRAINT "unreleasedBook_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;