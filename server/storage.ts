import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import { users, shops, products, orders, order_items, approvals, type User, type InsertUser, type Shop, type Product, type Order } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: string): Promise<void>;
  
  // Shop methods
  getShop(id: string): Promise<Shop | undefined>;
  getShopByOwnerId(ownerId: string): Promise<Shop | undefined>;
  createShop(shop: any): Promise<Shop>;
  updateShopStatus(id: string, status: string): Promise<void>;
  getShopsNearLocation(lat: number, lng: number, radius: number): Promise<Shop[]>;
  
  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByShopId(shopId: string): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, product: any): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  updateProductStatus(id: string, status: string): Promise<void>;
  
  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByShopId(shopId: string): Promise<Order[]>;
  getOrdersByCustomerId(customerId: string): Promise<Order[]>;
  getOrdersByCourierId(courierId: string): Promise<Order[]>;
  getAvailableOrdersForCouriers(): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  assignCourier(orderId: string, courierId: string): Promise<void>;
  
  // Approval methods
  createApproval(approval: any): Promise<void>;
  getPendingApprovals(): Promise<any[]>;
  getPendingApprovalsWithDetails(): Promise<any[]>;
  getApprovalById(id: string): Promise<any>;
  updateApprovalStatus(id: string, status: string, approvedBy: string, notes?: string): Promise<void>;
  
  // Admin methods
  getAllUsers(): Promise<any[]>;
  getAllShops(): Promise<any[]>;
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserStatus(id: string, status: string): Promise<void> {
    await db.update(users).set({ status, updated_at: new Date() }).where(eq(users.id, id));
  }

  // Shop methods
  async getShop(id: string): Promise<Shop | undefined> {
    const result = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    return result[0];
  }

  async getShopByOwnerId(ownerId: string): Promise<Shop | undefined> {
    const result = await db.select().from(shops).where(eq(shops.owner_id, ownerId)).limit(1);
    return result[0];
  }

  async createShop(shop: any): Promise<Shop> {
    const result = await db.insert(shops).values(shop).returning();
    return result[0];
  }

  async updateShopStatus(id: string, status: string): Promise<void> {
    await db.update(shops).set({ status, updated_at: new Date() }).where(eq(shops.id, id));
  }

  async getShopsNearLocation(lat: number, lng: number, radius: number): Promise<Shop[]> {
    // For now, return all approved shops since we don't have geographic filtering
    // In production, use PostGIS for proper geographic queries
    const result = await db.select().from(shops).where(eq(shops.status, 'approved'));
    return result;
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsByShopId(shopId: string): Promise<Product[]> {
    const result = await db.select().from(products).where(eq(products.shop_id, shopId)).orderBy(desc(products.created_at));
    return result;
  }

  async createProduct(product: any): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: any): Promise<Product> {
    const result = await db.update(products).set({ ...product, updated_at: new Date() }).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductStatus(id: string, status: string): Promise<void> {
    await db.update(products).set({ status, updated_at: new Date() }).where(eq(products.id, id));
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrdersByShopId(shopId: string): Promise<Order[]> {
    const result = await db.select().from(orders).where(eq(orders.shop_id, shopId)).orderBy(desc(orders.created_at));
    return result;
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const result = await db.select().from(orders).where(eq(orders.customer_id, customerId)).orderBy(desc(orders.created_at));
    return result;
  }

  async getOrdersByCourierId(courierId: string): Promise<Order[]> {
    const result = await db.select().from(orders).where(eq(orders.courier_id, courierId)).orderBy(desc(orders.created_at));
    return result;
  }

  async getAvailableOrdersForCouriers(): Promise<Order[]> {
    const result = await db.select({
      id: orders.id,
      total_amount: orders.total_amount,
      delivery_address: orders.delivery_address,
      status: orders.status,
      created_at: orders.created_at,
      shop_name: shops.name,
      shop_address: shops.address
    })
    .from(orders)
    .leftJoin(shops, eq(orders.shop_id, shops.id))
    .where(eq(orders.status, 'ready'))
    .orderBy(desc(orders.created_at));
    
    return result;
  }

  async createOrder(order: any): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status, updated_at: new Date() }).where(eq(orders.id, id));
  }

  async assignCourier(orderId: string, courierId: string): Promise<void> {
    await db.update(orders).set({ courier_id: courierId, updated_at: new Date() }).where(eq(orders.id, orderId));
  }

  // Approval methods
  async createApproval(approval: any): Promise<void> {
    await db.insert(approvals).values(approval);
  }

  async getPendingApprovals(): Promise<any[]> {
    const result = await db.select().from(approvals).where(eq(approvals.status, 'pending')).orderBy(desc(approvals.created_at));
    return result;
  }

  async getPendingApprovalsWithDetails(): Promise<any[]> {
    const result = await db.select({
      id: approvals.id,
      type: approvals.type,
      status: approvals.status,
      created_at: approvals.created_at,
      notes: approvals.notes,
      user_id: approvals.user_id,
      shop_id: approvals.shop_id,
      user_name: users.name,
      user_email: users.email,
      user_role: users.role,
      shop_name: shops.name,
      shop_address: shops.address
    })
    .from(approvals)
    .leftJoin(users, eq(approvals.user_id, users.id))
    .leftJoin(shops, eq(approvals.shop_id, shops.id))
    .where(eq(approvals.status, 'pending'))
    .orderBy(desc(approvals.created_at));
    
    return result;
  }

  async getApprovalById(id: string): Promise<any> {
    const result = await db.select().from(approvals).where(eq(approvals.id, id)).limit(1);
    return result[0];
  }

  async updateApprovalStatus(id: string, status: string, approvedBy: string, notes?: string): Promise<void> {
    await db.update(approvals).set({ 
      status, 
      approved_by: approvedBy, 
      notes,
      updated_at: new Date() 
    }).where(eq(approvals.id, id));
  }

  // Admin methods
  async getAllUsers(): Promise<any[]> {
    const result = await db.select().from(users).orderBy(desc(users.created_at));
    return result.map(user => ({ ...user, password: undefined })); // Remove password from response
  }

  async getAllShops(): Promise<any[]> {
    const result = await db.select({
      id: shops.id,
      name: shops.name,
      address: shops.address,
      phone: shops.phone,
      status: shops.status,
      created_at: shops.created_at,
      owner_name: users.name,
      owner_email: users.email
    })
    .from(shops)
    .leftJoin(users, eq(shops.owner_id, users.id))
    .orderBy(desc(shops.created_at));
    
    return result;
  }

  async getAdminStats(): Promise<any> {
    const totalUsers = await db.select().from(users);
    const totalShops = await db.select().from(shops);
    const totalProducts = await db.select().from(products);
    const totalOrders = await db.select().from(orders);
    const pendingApprovals = await db.select().from(approvals).where(eq(approvals.status, 'pending'));

    return {
      totalUsers: totalUsers.length,
      totalShops: totalShops.length,
      totalProducts: totalProducts.length,
      totalOrders: totalOrders.length,
      pendingApprovals: pendingApprovals.length,
      activeShops: totalShops.filter(s => s.status === 'approved').length,
      pendingUsers: totalUsers.filter(u => u.status === 'pending').length
    };
  }
}

export const storage = new DatabaseStorage();
