import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import BarcodeScanner from '../BarcodeScanner/BarcodeScanner';
import { 
  Store, 
  Package, 
  Clock, 
  CheckCircle, 
  Bell, 
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Camera,
  Barcode,
  Save,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Image,
  ExternalLink
} from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name?: string;
  courier_name?: string;
  customer_address: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  barcode?: string;
  description?: string;
  status: string;
}

interface ProductFormData {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  barcode: string;
  image_url: string;
}

const ShopkeeperDashboard: React.FC = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'analytics'>('orders');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    barcode: '',
    image_url: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [formError, setFormError] = useState('');
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0
  });

  const indianCategories = [
    'Grains & Cereals', 'Dairy', 'Fruits', 'Vegetables', 'Spices & Condiments',
    'Beverages', 'Snacks', 'Personal Care', 'Household', 'Instant Food', 'Bakery'
  ];

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new-order', (data) => {
        const newOrder: Order = {
          id: data.orderId,
          total_amount: data.totalAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
          customer_address: data.customerAddress,
          notes: data.notes
        };
        setPendingOrders(prev => [newOrder, ...prev]);
      });

      return () => {
        socket.off('new-order');
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(data);
      
      const pending = data.filter((order: Order) => order.status === 'pending');
      setPendingOrders(pending);

      const today = new Date().toDateString();
      const todayOrders = data.filter((order: Order) => 
        new Date(order.created_at).toDateString() === today
      );
      
      setStats(prev => ({
        ...prev,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0),
        activeOrders: data.filter((order: Order) => 
          ['accepted', 'preparing', 'ready'].includes(order.status)
        ).length,
        completedOrders: data.filter((order: Order) => order.status === 'delivered').length
      }));
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Get shop ID first
      const shopResponse = await fetch('/api/shop/my-shop', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        const productsResponse = await fetch(`/api/shops/${shopData.id}/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData);
          
          setStats(prev => ({
            ...prev,
            totalProducts: productsData.length,
            lowStockProducts: productsData.filter((p: Product) => p.stock < 10).length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPendingOrders(prev => prev.filter(order => order.id !== orderId));
        fetchOrders();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!productForm.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      setFormError('Valid price is required');
      return;
    }
    
    if (!productForm.stock || parseInt(productForm.stock) < 0) {
      setFormError('Valid stock quantity is required');
      return;
    }
    
    if (!productForm.category) {
      setFormError('Category is required');
      return;
    }
    
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        fetchProducts();
      } else {
        setFormError(result.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setFormError('Failed to save product. Please try again.');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      price: '',
      stock: '',
      category: '',
      description: '',
      barcode: '',
      image_url: ''
    });
    setFormError('');
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || '',
      barcode: product.barcode || '',
      image_url: product.image_url || ''
    });
    setShowProductModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetProductForm();
    setShowProductModal(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setProductForm(prev => ({
      ...prev,
      barcode: barcode
    }));
    setShowBarcodeScanner(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'accepted':
        return 'preparing';
      case 'preparing':
        return 'ready';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'accepted':
        return 'Start Preparing';
      case 'preparing':
        return 'Mark Ready';
      default:
        return null;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shop Management</h1>
            <p className="mt-1 opacity-90">Track your orders, products, and performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            {pendingOrders.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Today's Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
            <Package className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Today's Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.todayRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeOrders}</p>
            </div>
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats.completedOrders}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Store className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Low Stock</p>
              <p className="text-xl font-bold text-red-600">{stats.lowStockProducts}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-600 animate-bounce" />
              <h2 className="text-lg font-semibold text-yellow-800">
                New Orders Waiting ({pendingOrders.length})
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">ऑर्डर #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600">{order.customer_address}</p>
                    {order.notes && (
                      <p className="text-sm text-gray-500 mt-1">नोट: {order.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => acceptOrder(order.id)}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  ऑर्डर स्वीकार करें
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'orders', label: 'ऑर्डर', icon: Package, count: orders.length },
              { key: 'products', label: 'उत्पाद', icon: Store, count: products.length },
              { key: 'analytics', label: 'विश्लेषण', icon: TrendingUp }
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === key
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">अभी तक कोई ऑर्डर नहीं</h3>
                  <p className="text-gray-500">जब ग्राहक ऑर्डर देंगे तो वे यहाँ दिखाई देंगे</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">ऑर्डर #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">{order.customer_address}</p>
                        {order.customer_name && (
                          <p className="text-sm text-gray-600">ग्राहक: {order.customer_name}</p>
                        )}
                        {order.courier_name && (
                          <p className="text-sm text-gray-600">डिलीवरी: {order.courier_name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {getNextStatusLabel(order.status)}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product Management Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">उत्पाद सूची</h2>
                  <p className="text-gray-600">अपनी दुकान के उत्पादों का प्रबंधन करें</p>
                </div>
                <button
                  onClick={openAddModal}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>उत्पाद जोड़ें</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="उत्पाद खोजें..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="all">सभी श्रेणियां</option>
                    {indianCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">कोई उत्पाद नहीं मिला</h3>
                  <p className="text-gray-500 mb-4">शुरुआत करने के लिए अपनी इन्वेंटरी में उत्पाद जोड़ें</p>
                  <button
                    onClick={openAddModal}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    अपना पहला उत्पाद जोड़ें
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      {/* Product Image */}
                      {product.image_url && isValidImageUrl(product.image_url) && (
                        <div className="mb-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category}</p>
                          {product.barcode && (
                            <p className="text-xs text-gray-400 flex items-center mt-1">
                              <Barcode className="h-3 w-3 mr-1" />
                              {product.barcode}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleProductStatus(product.id, product.status)}
                            className={`p-1 rounded ${
                              product.status === 'active' 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {product.status === 'active' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">मूल्य:</span>
                          <span className="font-semibold text-emerald-600">₹{product.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">स्टॉक:</span>
                          <span className={`font-medium ${
                            product.stock < 10 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {product.stock} यूनिट
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">स्थिति:</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <Edit className="h-4 w-4" />
                          <span>संपादित करें</span>
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="flex items-center justify-center bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">विश्लेषण डैशबोर्ड</h3>
                <p className="text-gray-500">विस्तृत विश्लेषण जल्द ही आ रहा है...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'उत्पाद संपादित करें' : 'नया उत्पाद जोड़ें'}
                </h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-4">
                {/* Barcode Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      उत्पाद बारकोड
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Camera className="h-4 w-4" />
                      <span>बारकोड स्कैन करें</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={productForm.barcode}
                      onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="बारकोड दर्ज करें या स्कैन करें"
                    />
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      उत्पाद का नाम *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="उत्पाद का नाम दर्ज करें"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      श्रेणी *
                    </label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">श्रेणी चुनें</option>
                      {indianCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      मूल्य (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      स्टॉक मात्रा *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    विवरण
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="उत्पाद का विवरण दर्ज करें"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    छवि URL
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {productForm.image_url && isValidImageUrl(productForm.image_url) && (
                      <a
                        href={productForm.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {productForm.image_url && isValidImageUrl(productForm.image_url) && (
                    <div className="mt-2">
                      <img
                        src={productForm.image_url}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingProduct ? 'उत्पाद अपडेट करें' : 'उत्पाद जोड़ें'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
};

export default ShopkeeperDashboard;