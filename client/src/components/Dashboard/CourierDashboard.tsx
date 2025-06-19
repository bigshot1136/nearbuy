import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Clock, 
  Package, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  Star,
  TrendingUp,
  Calendar,
  Route
} from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  shop_name?: string;
  shop_address?: string;
  customer_name?: string;
  delivery_fee?: number;
}

const CourierDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    rating: 4.8,
    totalEarnings: 0
  });
  const [activeTab, setActiveTab] = useState<'available' | 'my-orders' | 'earnings'>('available');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyOrders();
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.on('new-order-ready', (data) => {
        fetchAvailableOrders();
      });

      socket.on('order-assigned', (data) => {
        if (data.courierId === user.id) {
          fetchMyOrders();
          fetchAvailableOrders();
        }
      });

      return () => {
        socket.off('new-order-ready');
        socket.off('order-assigned');
      };
    }
  }, [socket, user]);

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch('/api/orders/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAvailableOrders(data);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyOrders(data);
      
      const today = new Date().toDateString();
      const todayDeliveries = data.filter((order: Order) => 
        new Date(order.created_at).toDateString() === today && order.status === 'delivered'
      );
      
      setStats(prev => ({
        ...prev,
        todayDeliveries: todayDeliveries.length,
        todayEarnings: todayDeliveries.reduce((sum: number, order: Order) => sum + (order.delivery_fee || 20), 0),
        activeDeliveries: data.filter((order: Order) => 
          ['picked_up'].includes(order.status)
        ).length,
        completedDeliveries: data.filter((order: Order) => order.status === 'delivered').length
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/accept-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAvailableOrders();
        fetchMyOrders();
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
        fetchMyOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryFee = (amount: number) => {
    // Calculate delivery fee as 10% of order amount, minimum ₹15, maximum ₹50
    return Math.min(Math.max(amount * 0.1, 15), 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Courier Dashboard</h1>
            <p className="mt-1 opacity-90">Track deliveries and manage earnings</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Today's Deliveries</p>
              <p className="text-xl font-bold text-gray-900">{stats.todayDeliveries}</p>
            </div>
            <Package className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Today's Earnings</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.todayEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active Deliveries</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeDeliveries}</p>
            </div>
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats.completedDeliveries}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Rating</p>
              <p className="text-xl font-bold text-gray-900">{stats.rating}</p>
            </div>
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Available Orders</p>
              <p className="text-xl font-bold text-blue-600">{availableOrders.length}</p>
            </div>
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'available', label: 'Available Orders', icon: Package },
          { key: 'my-orders', label: 'My Deliveries', icon: Truck },
          { key: 'earnings', label: 'Earnings', icon: DollarSign }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {key === 'available' && availableOrders.length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {availableOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Available Orders Tab */}
      {activeTab === 'available' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Orders</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {availableOrders.length} available
            </span>
          </div>

          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">You are offline. Go online to see available orders.</p>
              </div>
            </div>
          )}

          {availableOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders available for delivery</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">Order #{order.id.slice(0, 8)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Pickup Location</h4>
                          <p className="text-sm text-gray-600">{order.shop_name}</p>
                          <p className="text-xs text-gray-500">{order.shop_address}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Delivery Address</h4>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Order Value: ₹{parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                        <span className="text-green-600 font-medium">
                          Delivery Fee: ₹{getDeliveryFee(parseFloat(order.total_amount.toString())).toFixed(2)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        Ready since: {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => acceptOrder(order.id)}
                        disabled={!isOnline}
                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                      >
                        <Truck className="h-3 w-3" />
                        <span>Accept Delivery</span>
                      </button>
                      
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1">
                        <Navigation className="h-3 w-3" />
                        <span>View Route</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Orders Tab */}
      {activeTab === 'my-orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Deliveries</h3>

          {myOrders.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No deliveries assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">Order #{order.id.slice(0, 8)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {order.delivery_address}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Value: ₹{parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                        <span className="text-green-600 font-medium">
                          Fee: ₹{getDeliveryFee(parseFloat(order.total_amount.toString())).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {order.status === 'picked_up' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Mark Delivered</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Today's Earnings</p>
                    <p className="text-2xl font-bold text-green-700">₹{stats.todayEarnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">This Week</p>
                    <p className="text-2xl font-bold text-blue-700">₹{(stats.todayEarnings * 5).toFixed(2)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Average per Delivery</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ₹{stats.todayDeliveries > 0 ? (stats.todayEarnings / stats.todayDeliveries).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Total Deliveries</p>
                  <p className="text-lg font-bold text-gray-900">{stats.completedDeliveries}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Success Rate</p>
                  <p className="text-lg font-bold text-gray-900">98%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                  <p className="text-lg font-bold text-gray-900">{stats.rating}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">On-time %</p>
                  <p className="text-lg font-bold text-gray-900">95%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;