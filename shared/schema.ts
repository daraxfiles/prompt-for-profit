import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productType: varchar("product_type", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  audience: text("audience").notNull(),
  problem: text("problem").notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 40 }).default("Draft").notNull(),
  suggestedPrice: varchar("suggested_price", { length: 120 }).default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  promptInput: jsonb("prompt_input").notNull(),
  generatedOutput: text("generated_output").notNull(),
  modelUsed: varchar("model_used", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Generation = typeof generations.$inferSelect;
