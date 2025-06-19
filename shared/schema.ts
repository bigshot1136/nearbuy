import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // customer, shopkeeper, courier, admin
  status: text("status").notNull().default("active"), // active, pending, suspended
  driving_license: text("driving_license"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  owner_id: uuid("owner_id").references(() => users.id).notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, suspended
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  shop_id: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  barcode: text("barcode"),
  image_url: text("image_url"),
  status: text("status").notNull().default("active"), // active, inactive
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customer_id: uuid("customer_id").references(() => users.id).notNull(),
  shop_id: uuid("shop_id").references(() => shops.id).notNull(),
  courier_id: uuid("courier_id").references(() => users.id),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  delivery_address: text("delivery_address").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, accepted, preparing, ready, picked_up, delivered, cancelled
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const order_items = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").references(() => orders.id).notNull(),
  product_id: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  shop_id: uuid("shop_id").references(() => shops.id),
  type: text("type").notNull(), // user_registration, shop_approval
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approved_by: uuid("approved_by").references(() => users.id),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  phone: true,
  password: true,
  role: true,
  driving_license: true,
});

export const insertShopSchema = createInsertSchema(shops).pick({
  name: true,
  address: true,
  phone: true,
  latitude: true,
  longitude: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  stock: true,
  category: true,
  barcode: true,
  image_url: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof order_items.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
