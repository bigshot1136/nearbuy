import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import ShopkeeperDashboard from './components/Dashboard/ShopkeeperDashboard';
import CourierDashboard from './components/Dashboard/CourierDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ShopSetup from './components/ShopSetup/ShopSetup';
import Layout from './components/Layout/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const ShopkeeperRoute: React.FC = () => {
  const { user } = useAuth();
  const [needsShopSetup, setNeedsShopSetup] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkShopStatus = async () => {
      if (user?.role === 'shopkeeper') {
        try {
          const response = await fetch('/api/shop/my-shop', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.status === 404) {
            setNeedsShopSetup(true);
          } else {
            setNeedsShopSetup(false);
          }
        } catch (error) {
          console.error('Error checking shop status:', error);
          setNeedsShopSetup(true);
        }
      }
    };

    checkShopStatus();
  }, [user]);

  if (needsShopSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (needsShopSetup) {
    return <ShopSetup onShopCreated={() => setNeedsShopSetup(false)} />;
  }

  return (
    <Layout>
      <ShopkeeperDashboard />
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}`} replace />} />
      
      <Route path="/customer" element={
        <PrivateRoute allowedRoles={['customer']}>
          <Layout>
            <CustomerDashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/shopkeeper" element={
        <PrivateRoute allowedRoles={['shopkeeper']}>
          <ShopkeeperRoute />
        </PrivateRoute>
      } />
      
      <Route path="/courier" element={
        <PrivateRoute allowedRoles={['courier']}>
          <Layout>
            <CourierDashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['admin']}>
          <Layout>
            <AdminDashboard />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      } />

      <Route path="/" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;