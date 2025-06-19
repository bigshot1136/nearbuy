import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors());
  
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, phone, password, role, driving_license } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered. Please use a different email or login.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine user status based on role
      const status = ['shopkeeper', 'courier'].includes(role) ? 'pending' : 'active';

      // Create user
      const user = await storage.createUser({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        status,
        driving_license: driving_license || null
      });

      // Create approval request for shopkeepers and couriers
      if (['shopkeeper', 'courier'].includes(role)) {
        await storage.createApproval({
          user_id: user.id,
          type: 'user_registration',
          status: 'pending'
        });

        return res.json({
          message: 'Registration successful. Awaiting admin approval.',
          requiresApproval: true
        });
      }

      // Generate JWT for customers and admins
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Account pending approval' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Account suspended' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Shop routes
  app.post('/api/shop', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can create shops' });
      }

      // Check if user already has a shop
      const existingShop = await storage.getShopByOwnerId(req.user.id);
      if (existingShop) {
        return res.status(400).json({ 
          message: 'You already have a shop registered',
          shop: existingShop 
        });
      }

      const { name, address, phone, latitude, longitude } = req.body;
      
      // Validate required fields
      if (!name || !address) {
        return res.status(400).json({ message: 'Shop name and address are required' });
      }
      
      const shop = await storage.createShop({
        name,
        address,
        phone: phone || '9999999999',
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        owner_id: req.user.id,
        status: 'pending'
      });

      // Create approval request
      await storage.createApproval({
        shop_id: shop.id,
        type: 'shop_approval',
        status: 'pending'
      });

      res.json({ 
        message: 'Shop created successfully. Awaiting admin approval.',
        shop: shop 
      });
    } catch (error) {
      console.error('Shop creation error:', error);
      
      // Handle specific database errors
      if (error.message && error.message.includes('duplicate')) {
        return res.status(400).json({ message: 'A shop with this information already exists' });
      }
      
      res.status(500).json({ 
        message: 'Failed to create shop. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get('/api/shop/my-shop', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can access this endpoint' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      res.json(shop);
    } catch (error) {
      console.error('Get shop error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  });

  // Product routes
  app.post('/api/products', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can add products' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const { name, description, price, stock, category, barcode, image_url } = req.body;
      
      const product = await storage.createProduct({
        shop_id: shop.id,
        name,
        description,
        price: price.toString(),
        stock,
        category,
        barcode,
        image_url,
        status: 'active'
      });

      res.json(product);
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.get('/api/shops/:shopId/products', authenticateToken, async (req, res) => {
    try {
      const { shopId } = req.params;
      
      // Check if user owns the shop or is admin
      if (req.user.role === 'shopkeeper') {
        const shop = await storage.getShopByOwnerId(req.user.id);
        if (!shop || shop.id !== shopId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const products = await storage.getProductsByShopId(shopId);
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Failed to get products' });
    }
  });

  app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can update products' });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop || shop.id !== product.shop_id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { name, description, price, stock, category, barcode, image_url } = req.body;
      
      const updatedProduct = await storage.updateProduct(req.params.id, {
        name,
        description,
        price: price.toString(),
        stock,
        category,
        barcode,
        image_url
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('Product update error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can delete products' });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop || shop.id !== product.shop_id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Product deletion error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  app.patch('/api/products/:id/status', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can update product status' });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop || shop.id !== product.shop_id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { status } = req.body;
      await storage.updateProductStatus(req.params.id, status);
      
      res.json({ message: 'Product status updated successfully' });
    } catch (error) {
      console.error('Product status update error:', error);
      res.status(500).json({ message: 'Failed to update product status' });
    }
  });

  // Order routes
  app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
      let orders = [];
      
      if (req.user.role === 'shopkeeper') {
        const shop = await storage.getShopByOwnerId(req.user.id);
        if (shop) {
          orders = await storage.getOrdersByShopId(shop.id);
        }
      } else if (req.user.role === 'customer') {
        orders = await storage.getOrdersByCustomerId(req.user.id);
      } else if (req.user.role === 'courier') {
        orders = await storage.getOrdersByCourierId(req.user.id);
      }

      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  });

  app.get('/api/orders/available', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'courier') {
        return res.status(403).json({ message: 'Only couriers can access available orders' });
      }

      const availableOrders = await storage.getAvailableOrdersForCouriers();
      res.json(availableOrders);
    } catch (error) {
      console.error('Get available orders error:', error);
      res.status(500).json({ message: 'Failed to get available orders' });
    }
  });

  app.post('/api/orders/:id/accept-delivery', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'courier') {
        return res.status(403).json({ message: 'Only couriers can accept deliveries' });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status !== 'ready') {
        return res.status(400).json({ message: 'Order is not ready for pickup' });
      }

      await storage.assignCourier(req.params.id, req.user.id);
      await storage.updateOrderStatus(req.params.id, 'picked_up');
      
      // Emit socket event
      io.to(`order-${req.params.id}`).emit('order-status-updated', {
        orderId: req.params.id,
        status: 'picked_up',
        courierId: req.user.id
      });

      res.json({ message: 'Order accepted for delivery' });
    } catch (error) {
      console.error('Accept delivery error:', error);
      res.status(500).json({ message: 'Failed to accept delivery' });
    }
  });

  app.post('/api/orders/:id/accept', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ message: 'Only shopkeepers can accept orders' });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const shop = await storage.getShopByOwnerId(req.user.id);
      if (!shop || shop.id !== order.shop_id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.updateOrderStatus(req.params.id, 'accepted');
      
      // Emit socket event
      io.to(`order-${req.params.id}`).emit('order-status-updated', {
        orderId: req.params.id,
        status: 'accepted'
      });

      res.json({ message: 'Order accepted successfully' });
    } catch (error) {
      console.error('Order accept error:', error);
      res.status(500).json({ message: 'Failed to accept order' });
    }
  });

  app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions based on role and status
      if (req.user.role === 'shopkeeper') {
        const shop = await storage.getShopByOwnerId(req.user.id);
        if (!shop || shop.id !== order.shop_id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (req.user.role === 'courier') {
        if (order.courier_id !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { status } = req.body;
      await storage.updateOrderStatus(req.params.id, status);
      
      // Emit socket event
      io.to(`order-${req.params.id}`).emit('order-status-updated', {
        orderId: req.params.id,
        status
      });

      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      console.error('Order status update error:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Public shop routes
  app.get('/api/shops/nearby', async (req, res) => {
    try {
      const { lat, lng, radius = 10 } = req.query;
      const shops = await storage.getShopsNearLocation(
        lat ? parseFloat(lat as string) : 0,
        lng ? parseFloat(lng as string) : 0,
        radius ? parseFloat(radius as string) : 10
      );
      res.json(shops);
    } catch (error) {
      console.error('Get nearby shops error:', error);
      res.status(500).json({ message: 'Failed to get nearby shops' });
    }
  });

  app.get('/api/shops/:shopId/products/public', async (req, res) => {
    try {
      const { shopId } = req.params;
      const products = await storage.getProductsByShopId(shopId);
      // Only return active products for public view
      const activeProducts = products.filter(p => p.status === 'active');
      res.json(activeProducts);
    } catch (error) {
      console.error('Get shop products error:', error);
      res.status(500).json({ message: 'Failed to get shop products' });
    }
  });

  // Admin routes
  app.get('/api/admin/approvals', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const approvals = await storage.getPendingApprovalsWithDetails();
      res.json(approvals);
    } catch (error) {
      console.error('Get approvals error:', error);
      res.status(500).json({ message: 'Failed to get approvals' });
    }
  });

  app.get('/api/admin/pending-approvals', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const approvals = await storage.getPendingApprovalsWithDetails();
      res.json(approvals);
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({ message: 'Failed to get pending approvals' });
    }
  });

  app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.get('/api/admin/shops', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const shops = await storage.getAllShops();
      res.json(shops);
    } catch (error) {
      console.error('Get shops error:', error);
      res.status(500).json({ message: 'Failed to get shops' });
    }
  });

  app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: 'Failed to get admin stats' });
    }
  });

  app.post('/api/admin/approvals/:id/:action', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id, action } = req.params;
      const { notes } = req.body;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // Get the approval details
      const approval = await storage.getApprovalById(id);
      if (!approval) {
        return res.status(404).json({ message: 'Approval not found' });
      }

      // Update approval status
      await storage.updateApprovalStatus(id, status, req.user.id, notes);

      // If approving a user registration, update user status
      if (approval.type === 'user_registration' && action === 'approve') {
        await storage.updateUserStatus(approval.user_id, 'active');
      } else if (approval.type === 'user_registration' && action === 'reject') {
        await storage.updateUserStatus(approval.user_id, 'rejected');
      }

      // If approving a shop, update shop status
      if (approval.type === 'shop_approval' && action === 'approve') {
        await storage.updateShopStatus(approval.shop_id, 'approved');
      } else if (approval.type === 'shop_approval' && action === 'reject') {
        await storage.updateShopStatus(approval.shop_id, 'rejected');
      }

      res.json({ message: `Approval ${action}d successfully` });
    } catch (error) {
      console.error('Approval action error:', error);
      res.status(500).json({ message: 'Failed to process approval' });
    }
  });

  return httpServer;
}
