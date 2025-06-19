import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  MapPin, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Star, 
  Clock,
  Package,
  CheckCircle,
  Search,
  Filter,
  Heart,
  Truck,
  Phone,
  MessageCircle,
  Store,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number;
  owner_name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  barcode?: string;
  status: string;
  image_url?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shop_name?: string;
  courier_name?: string;
  delivery_fee?: number;
  customer_address: string;
}

const CustomerDashboard: React.FC = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'shops' | 'cart' | 'orders'>('shops');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState('B-25, लाजपत नगर, नई दिल्ली 110024');
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    fetchNearbyShops();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('order-accepted', (data) => {
        fetchOrders();
      });

      socket.on('order-status-updated', (data) => {
        fetchOrders();
      });

      return () => {
        socket.off('order-accepted');
        socket.off('order-status-updated');
      };
    }
  }, [socket]);

  const fetchNearbyShops = async () => {
    try {
      const response = await fetch(`/api/shops/nearby?lat=28.5665&lng=77.2431`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchProducts = async (shopId: string) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    fetchProducts(shop.id);
    setActiveTab('shops');
    // Clear cart when switching shops
    setCart([]);
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.stock
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.productId !== productId));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setOrderError('');
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: getTotalAmount() + 40, // Adding delivery fee
          customerAddress: deliveryAddress,
          customerLat: 28.5665,
          customerLng: 77.2431,
          notes: 'कृपया सावधानी से संभालें'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setCart([]);
        setActiveTab('orders');
        fetchOrders();
        // Refresh products to show updated stock
        if (selectedShop) {
          fetchProducts(selectedShop.id);
        }
      } else {
        setOrderError(data.error || 'Order देने में विफल');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError('Order देने में विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
      case 'picked_up':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'लंबित';
      case 'accepted':
        return 'स्वीकृत';
      case 'preparing':
        return 'तैयार हो रहा';
      case 'ready':
        return 'तैयार';
      case 'picked_up':
        return 'उठाया गया';
      case 'delivered':
        return 'डिलीवर';
      case 'cancelled':
        return 'रद्द';
      default:
        return status;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory && product.status === 'active';
  });

  const categories = ['all', ...Array.from(new Set(products.filter(p => p.status === 'active').map(p => p.category)))];

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const getAvailableStock = (product: Product) => {
    const cartQuantity = getCartItemQuantity(product.id);
    return product.stock - cartQuantity;
  };

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
            <h1 className="text-2xl font-bold">नियरबाय में आपका स्वागत है</h1>
            <p className="mt-1 opacity-90">आसपास की दुकानें खोजें और तुरंत Order करें</p>
          </div>
          <div className="flex items-center space-x-2 text-sm bg-white/20 px-3 py-2 rounded-lg">
            <MapPin className="h-4 w-4" />
            <span>नई दिल्ली</span>
          </div>
        </div>
        
        {/* Delivery Address */}
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Delivery पता:</span>
          </div>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="mt-1 w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Delivery पता दर्ज करें"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'shops', label: 'दुकानें ब्राउज़ करें', icon: MapPin, count: shops.length },
              { key: 'cart', label: 'कार्ट', icon: ShoppingCart, count: cart.length },
              { key: 'orders', label: 'मेरे Order', icon: Package, count: orders.length }
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
                {count > 0 && (
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
          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <div className="space-y-6">
              {!selectedShop ? (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="दुकानें खोजें..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Shops Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => handleShopSelect(shop)}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {shop.name}
                          </h3>
                          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-yellow-700">{shop.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {shop.address}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500 text-xs">मालिक: {shop.owner_name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-emerald-600 font-medium">15-20 मिनट</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Shop Header */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Store className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedShop.name}</h2>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {selectedShop.address}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{selectedShop.rating}</span>
                          </div>
                          <span className="text-sm text-emerald-600 font-medium">15-20 मिनट Delivery</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedShop(null);
                        setProducts([]);
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← दुकानों पर वापस
                    </button>
                  </div>

                  {/* Cart Summary (if items in cart) */}
                  {cart.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-5 w-5 text-emerald-600" />
                          <span className="font-medium text-emerald-800">
                            कार्ट में {cart.length} आइटम{cart.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-emerald-800">
                            ₹{getTotalAmount().toFixed(2)}
                          </span>
                          <button
                            onClick={() => setActiveTab('cart')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            कार्ट देखें
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="उत्पाद खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'सभी श्रेणियां' : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => {
                      const availableStock = getAvailableStock(product);
                      const cartQuantity = getCartItemQuantity(product.id);
                      
                      return (
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
                              {product.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-sm text-gray-500">
                                  स्टॉक: {availableStock} उपलब्ध
                                </span>
                                {cartQuantity > 0 && (
                                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                                    कार्ट में {cartQuantity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <span className="text-lg font-bold text-emerald-600">₹{product.price}</span>
                              <button className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <Heart className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {availableStock === 0 ? (
                            <div className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center font-medium">
                              स्टॉक समाप्त
                            </div>
                          ) : cartQuantity > 0 ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="p-2 hover:bg-emerald-100 rounded-l-lg transition-colors"
                                >
                                  <Minus className="h-4 w-4 text-emerald-600" />
                                </button>
                                <span className="font-medium px-3 text-emerald-800">{cartQuantity}</span>
                                <button
                                  onClick={() => addToCart(product)}
                                  disabled={availableStock === 0}
                                  className="p-2 hover:bg-emerald-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="h-4 w-4 text-emerald-600" />
                                </button>
                              </div>
                              <span className="text-sm font-medium text-emerald-600">
                                ₹{(product.price * cartQuantity).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                              कार्ट में जोड़ें
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Cart Tab */}
          {activeTab === 'cart' && (
            <div className="space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">आपका कार्ट खाली है</h3>
                  <p className="text-gray-500 mb-4">कार्ट में आइटम जोड़ने के लिए दुकानें ब्राउज़ करें</p>
                  <button
                    onClick={() => setActiveTab('shops')}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    खरीदारी शुरू करें
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Error Message */}
                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-red-800 font-medium">Order विफल</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{orderError}</p>
                    </div>
                  )}

                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">₹{item.price} प्रत्येक</p>
                          <p className="text-xs text-gray-500">अधिकतम उपलब्ध: {item.maxStock}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-300">
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium px-3">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const product = products.find(p => p.id === item.productId);
                                if (product) addToCart(product);
                              }}
                              disabled={item.quantity >= item.maxStock}
                              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="w-20 text-right">
                            <span className="font-bold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order सारांश</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">उप-योग ({cart.length} आइटम)</span>
                        <span className="font-medium">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Delivery शुल्क</span>
                        <span className="font-medium">₹40.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">सेवा शुल्क</span>
                        <span className="font-medium">₹5.00</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>कुल</span>
                        <span className="text-emerald-600">₹{(getTotalAmount() + 45).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800 text-sm font-medium">स्टॉक जानकारी</span>
                      </div>
                      <p className="text-blue-700 text-xs mt-1">
                        चेकआउट पर उत्पाद उपलब्धता की जांच की जाती है। यदि स्टॉक समाप्त हो जाता है तो आइटम अनुपलब्ध हो सकते हैं।
                      </p>
                    </div>

                    <button
                      onClick={placeOrder}
                      disabled={loading}
                      className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 font-medium transition-all duration-200 shadow-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Order दे रहे हैं...</span>
                        </div>
                      ) : (
                        'Order दें'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">अभी तक कोई Order नहीं</h3>
                  <p className="text-gray-500 mb-4">इसे यहाँ देखने के लिए अपना पहला Order दें</p>
                  <button
                    onClick={() => setActiveTab('shops')}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    खरीदारी शुरू करें
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{getStatusText(order.status)}</span>
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(order.created_at).toLocaleDateString()} को {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                          {order.shop_name && (
                            <p className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              से: {order.shop_name}
                            </p>
                          )}
                          <p className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            तक: {order.customer_address}
                          </p>
                          {order.courier_name && (
                            <p className="flex items-center">
                              <Truck className="h-4 w-4 mr-2" />
                              Delivery: {order.courier_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{order.delivery_fee || 40} Delivery सहित
                        </p>
                      </div>
                    </div>
                    
                    {/* Order Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        {order.status === 'delivered' && (
                          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                            Order रेट करें
                          </button>
                        )}
                        {['picked_up', 'ready'].includes(order.status) && (
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>Delivery को कॉल करें</span>
                          </button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          विवरण देखें
                        </button>
                        {order.status === 'pending' && (
                          <button className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                            रद्द करें
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button className="px-4 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                            फिर से Order करें
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;