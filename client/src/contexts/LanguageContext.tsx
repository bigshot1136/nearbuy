import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Common
    'welcome': 'Welcome to Nearbuy',
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'active': 'Active',
    'inactive': 'Inactive',
    
    // Auth
    'email': 'Email Address',
    'password': 'Password',
    'confirmPassword': 'Confirm Password',
    'name': 'Full Name',
    'phone': 'Phone Number',
    'signIn': 'Sign In',
    'signUp': 'Sign Up',
    'createAccount': 'Create Account',
    'alreadyHaveAccount': 'Already have an account?',
    'dontHaveAccount': "Don't have an account?",
    'welcomeBack': 'Welcome Back',
    'joinNearbuy': 'Join Nearbuy',
    'accountType': 'Select Account Type',
    
    // Roles
    'customer': 'Customer',
    'shopkeeper': 'Shopkeeper',
    'courier': 'Delivery Partner',
    'admin': 'Administrator',
    'customerDesc': 'Order from nearby shops',
    'shopkeeperDesc': 'Manage your shop and orders',
    'courierDesc': 'Deliver orders and earn money',
    
    // Dashboard
    'dashboard': 'Dashboard',
    'orders': 'Orders',
    'products': 'Products',
    'shops': 'Shops',
    'analytics': 'Analytics',
    'earnings': 'Earnings',
    'cart': 'Cart',
    'myOrders': 'My Orders',
    'browseShops': 'Browse Shops',
    
    // Shop Management
    'shopManagement': 'Shop Management',
    'addProduct': 'Add Product',
    'productName': 'Product Name',
    'price': 'Price',
    'stock': 'Stock',
    'category': 'Category',
    'description': 'Description',
    'barcode': 'Barcode',
    'scanBarcode': 'Scan Barcode',
    'addToCart': 'Add to Cart',
    'outOfStock': 'Out of Stock',
    'lowStock': 'Low Stock',
    
    // Orders
    'newOrder': 'New Order',
    'acceptOrder': 'Accept Order',
    'orderAccepted': 'Order Accepted',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'pickedUp': 'Picked Up',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'placeOrder': 'Place Order',
    'orderTotal': 'Order Total',
    'deliveryFee': 'Delivery Fee',
    'serviceFee': 'Service Fee',
    
    // Admin
    'adminDashboard': 'Admin Dashboard',
    'pendingApprovals': 'Pending Approvals',
    'approveUser': 'Approve User',
    'rejectUser': 'Reject User',
    'approveShop': 'Approve Shop',
    'rejectShop': 'Reject Shop',
    'totalUsers': 'Total Users',
    'totalOrders': 'Total Orders',
    'totalRevenue': 'Total Revenue',
    'activeShops': 'Active Shops',
    
    // Courier
    'courierDashboard': 'Courier Dashboard',
    'availableOrders': 'Available Orders',
    'myDeliveries': 'My Deliveries',
    'acceptDelivery': 'Accept Delivery',
    'markDelivered': 'Mark as Delivered',
    'todayEarnings': 'Today\'s Earnings',
    'todayDeliveries': 'Today\'s Deliveries',
    
    // Shop Setup
    'shopSetup': 'Shop Setup',
    'shopName': 'Shop Name',
    'shopAddress': 'Shop Address',
    'createShop': 'Create Shop',
    'shopPending': 'Shop application submitted for approval',
    
    // Language
    'language': 'Language',
    'english': 'English',
    'hindi': 'हिंदी'
  },
  hi: {
    // Common
    'welcome': 'नियरबाय में आपका स्वागत है',
    'login': 'लॉगिन',
    'register': 'पंजीकरण',
    'logout': 'लॉगआउट',
    'save': 'सेव करें',
    'cancel': 'रद्द करें',
    'delete': 'हटाएं',
    'edit': 'संपादित करें',
    'add': 'जोड़ें',
    'search': 'खोजें',
    'filter': 'फिल्टर',
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफल',
    'pending': 'लंबित',
    'approved': 'अनुमोदित',
    'rejected': 'अस्वीकृत',
    'active': 'सक्रिय',
    'inactive': 'निष्क्रिय',
    
    // Auth
    'email': 'ईमेल पता',
    'password': 'पासवर्ड',
    'confirmPassword': 'पासवर्ड की पुष्टि करें',
    'name': 'पूरा नाम',
    'phone': 'फोन नंबर',
    'signIn': 'साइन इन करें',
    'signUp': 'साइन अप करें',
    'createAccount': 'खाता बनाएं',
    'alreadyHaveAccount': 'पहले से खाता है?',
    'dontHaveAccount': 'खाता नहीं है?',
    'welcomeBack': 'वापस आपका स्वागत है',
    'joinNearbuy': 'नियरबाय में शामिल हों',
    'accountType': 'अपना खाता प्रकार चुनें',
    
    // Roles
    'customer': 'ग्राहक',
    'shopkeeper': 'दुकानदार',
    'courier': 'डिलीवरी पार्टनर',
    'admin': 'प्रशासक',
    'customerDesc': 'आसपास की दुकानों से ऑर्डर करें',
    'shopkeeperDesc': 'अपनी दुकान और ऑर्डर का प्रबंधन करें',
    'courierDesc': 'ऑर्डर डिलीवर करें और पैसे कमाएं',
    
    // Dashboard
    'dashboard': 'डैशबोर्ड',
    'orders': 'ऑर्डर',
    'products': 'उत्पाद',
    'shops': 'दुकानें',
    'analytics': 'विश्लेषण',
    'earnings': 'कमाई',
    'cart': 'कार्ट',
    'myOrders': 'मेरे ऑर्डर',
    'browseShops': 'दुकानें ब्राउज़ करें',
    
    // Shop Management
    'shopManagement': 'दुकान प्रबंधन',
    'addProduct': 'उत्पाद जोड़ें',
    'productName': 'उत्पाद का नाम',
    'price': 'मूल्य',
    'stock': 'स्टॉक',
    'category': 'श्रेणी',
    'description': 'विवरण',
    'barcode': 'बारकोड',
    'scanBarcode': 'बारकोड स्कैन करें',
    'addToCart': 'कार्ट में जोड़ें',
    'outOfStock': 'स्टॉक समाप्त',
    'lowStock': 'कम स्टॉक',
    
    // Orders
    'newOrder': 'नया ऑर्डर',
    'acceptOrder': 'ऑर्डर स्वीकार करें',
    'orderAccepted': 'ऑर्डर स्वीकृत',
    'preparing': 'तैयार हो रहा',
    'ready': 'तैयार',
    'pickedUp': 'उठाया गया',
    'delivered': 'डिलीवर',
    'cancelled': 'रद्द',
    'placeOrder': 'ऑर्डर दें',
    'orderTotal': 'कुल राशि',
    'deliveryFee': 'डिलीवरी शुल्क',
    'serviceFee': 'सेवा शुल्क',
    
    // Admin
    'adminDashboard': 'प्रशासन डैशबोर्ड',
    'pendingApprovals': 'लंबित अनुमोदन',
    'approveUser': 'उपयोगकर्ता अनुमोदित करें',
    'rejectUser': 'उपयोगकर्ता अस्वीकार करें',
    'approveShop': 'दुकान अनुमोदित करें',
    'rejectShop': 'दुकान अस्वीकार करें',
    'totalUsers': 'कुल उपयोगकर्ता',
    'totalOrders': 'कुल ऑर्डर',
    'totalRevenue': 'कुल राजस्व',
    'activeShops': 'सक्रिय दुकानें',
    
    // Courier
    'courierDashboard': 'कूरियर डैशबोर्ड',
    'availableOrders': 'उपलब्ध ऑर्डर',
    'myDeliveries': 'मेरी डिलीवरी',
    'acceptDelivery': 'डिलीवरी स्वीकार करें',
    'markDelivered': 'डिलीवर के रूप में चिह्नित करें',
    'todayEarnings': 'आज की कमाई',
    'todayDeliveries': 'आज की डिलीवरी',
    
    // Shop Setup
    'shopSetup': 'दुकान सेटअप',
    'shopName': 'दुकान का नाम',
    'shopAddress': 'दुकान का पता',
    'createShop': 'दुकान बनाएं',
    'shopPending': 'दुकान आवेदन अनुमोदन के लिए भेजा गया',
    
    // Language
    'language': 'भाषा',
    'english': 'English',
    'hindi': 'हिंदी'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const value = {
    language,
    toggleLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};