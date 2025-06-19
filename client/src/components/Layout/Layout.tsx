import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  ShoppingBag, 
  User, 
  LogOut, 
  ShoppingCart, 
  Store, 
  Truck, 
  Settings,
  Bell,
  Globe
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'customer':
        return <ShoppingCart className="h-5 w-5" />;
      case 'shopkeeper':
        return <Store className="h-5 w-5" />;
      case 'courier':
        return <Truck className="h-5 w-5" />;
      case 'admin':
        return <Settings className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'customer':
        return 'Customer Portal';
      case 'shopkeeper':
        return t('shopManagement');
      case 'courier':
        return t('courierDashboard');
      case 'admin':
        return t('adminDashboard');
      default:
        return t('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Nearbuy
                </h1>
                <p className="text-xs text-gray-500">{getRoleTitle(user?.role || '')}</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('language')}
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {language === 'en' ? 'EN' : 'हि'}
                </span>
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full">
                  {getRoleIcon(user?.role || '')}
                  <span className="sr-only">{user?.role}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{t(user?.role || '')}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;