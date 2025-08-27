import { env } from "@/env";
import * as schema from "@/server/db/schema/index";
import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
    connection: { connectionString: env.DATABASE_URL },
    casing: "snake_case",
    schema,
});

// Helpers

type Schema = typeof schema;
type TSchema = ExtractTablesWithRelations<Schema>;

type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfig<"one" | "many", boolean, TSchema, TSchema[TableName]>["with"];

export type InferResultType<
    TableName extends keyof TSchema,
    With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<TSchema, TSchema[TableName], { with: With }>;

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
