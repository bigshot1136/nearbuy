import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Eye,
  UserPlus,
  Building,
  FileText
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  pendingApprovals: number;
  activeShops: number;
  pendingUsers: number;
}

interface PendingApproval {
  id: string;
  type: string;
  user_name: string;
  user_email: string;
  user_role: string;
  shop_name?: string;
  shop_address?: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

interface Shop {
  id: string;
  name: string;
  address: string;
  owner_name: string;
  owner_email: string;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalShops: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    activeShops: 0,
    pendingUsers: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'shops'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
    fetchPendingApprovals();
    fetchAllUsers();
    fetchAllShops();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/admin/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPendingApprovals(data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllShops = async () => {
    try {
      const response = await fetch('/api/admin/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAllShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/approvals/${approvalId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          notes: action === 'approve' ? 'Approved by admin' : 'Rejected by admin' 
        })
      });

      if (response.ok) {
        fetchPendingApprovals();
        fetchAllUsers();
        fetchAllShops();
        fetchAdminStats();
      }
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'shopkeeper':
        return 'bg-blue-100 text-blue-800';
      case 'courier':
        return 'bg-orange-100 text-orange-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 opacity-90">Manage platform users, shops, and approvals</p>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            {pendingApprovals.length > 0 && (
              <div className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {pendingApprovals.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'approvals', label: 'Approvals', icon: UserCheck },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'shops', label: 'Shops', icon: Store }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {key === 'approvals' && pendingApprovals.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Active Shops</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeShops}</p>
                </div>
                <Store className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Products</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Pending Approvals</p>
                  <p className="text-xl font-bold text-red-600">{stats.pendingApprovals}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">User Distribution</h4>
                <div className="space-y-2">
                  {['customer', 'shopkeeper', 'courier', 'admin'].map(role => {
                    const count = allUsers.filter(u => u.role === role).length;
                    return (
                      <div key={role} className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(role)}`}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Shop Status</h4>
                <div className="space-y-2">
                  {['approved', 'pending', 'rejected'].map(status => {
                    const count = allShops.filter(s => s.status === status).length;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {pendingApprovals.length} pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(approval.user_role)}`}>
                            {approval.user_role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {approval.type === 'user_registration' ? 'User Registration' : 'Shop Approval'}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-gray-900">{approval.user_name}</h4>
                        <p className="text-sm text-gray-600">{approval.user_email}</p>
                        
                        {approval.shop_name && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">{approval.shop_name}</p>
                            <p className="text-xs text-gray-500">{approval.shop_address}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted: {new Date(approval.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(approval.id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval(approval.id, 'reject')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shops Tab */}
      {activeTab === 'shops' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Shops</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allShops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                        <div className="text-sm text-gray-500">{shop.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shop.owner_name}</div>
                        <div className="text-sm text-gray-500">{shop.owner_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(shop.status)}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(shop.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;