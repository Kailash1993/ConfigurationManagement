import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Configuration nodes table for hierarchical structure
export const configNodes = pgTable("config_nodes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // The $NAME field
  parentId: integer("parent_id").references(() => configNodes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  properties: jsonb("properties").notNull().default('{}'), // User-defined properties
  defaults: jsonb("defaults").notNull().default('{}'), // Default values
  nodeType: varchar("node_type").notNull(), // 'territory', 'center', 'user', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  configNodes: many(configNodes),
}));

export const configNodesRelations = relations(configNodes, ({ one, many }) => ({
  user: one(users, {
    fields: [configNodes.userId],
    references: [users.id],
  }),
  parent: one(configNodes, {
    fields: [configNodes.parentId],
    references: [configNodes.id],
    relationName: "parent_child",
  }),
  children: many(configNodes, {
    relationName: "parent_child",
  }),
}));

// Schema validation
export const insertConfigNodeSchema = createInsertSchema(configNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  parentId: z.number().nullable().optional(),
});

export const updateConfigNodeSchema = insertConfigNodeSchema.partial().omit({
  userId: true,
});

// Property schema for dynamic properties
export const propertySchema = z.object({
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  value: z.any(),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

export const propertiesSchema = z.record(propertySchema);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ConfigNode = typeof configNodes.$inferSelect;
export type InsertConfigNode = z.infer<typeof insertConfigNodeSchema>;
export type UpdateConfigNode = z.infer<typeof updateConfigNodeSchema>;
export type Property = z.infer<typeof propertySchema>;
export type Properties = z.infer<typeof propertiesSchema>;
