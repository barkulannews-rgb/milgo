import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductVariant,
  CartItem,
  Order,
  Language,
  StoreSettings,
  FragranceFamily,
  StaffUser,
} from './types';
import { storeRepo } from './lib/storage';
import { useRouter } from './lib/router';
import { AnnouncementBar } from './components/store/AnnouncementBar';
import { Header } from './components/store/Header';
import { Hero } from './components/store/Hero';
import { FeaturedCollections } from './components/store/FeaturedCollections';
import { ProductCatalog } from './components/store/ProductCatalog';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { OrderSuccessModal } from './components/store/OrderSuccessModal';
import { OrderTrackerModal } from './components/store/OrderTrackerModal';
import { PolicyPage } from './components/store/PolicyPage';
import { Footer } from './components/store/Footer';

// Admin ERP & Auth components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';

const ADMIN_TABS: AdminTab[] = ['dashboard', 'orders', 'products', 'inventory', 'purchases', 'delivery', 'promotions', 'hero', 'expenses', 'finances', 'reports', 'users', 'payments', 'settings'];
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminInventory } from './components/admin/AdminInventory';
import { AdminPurchases } from './components/admin/AdminPurchases';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminDelivery } from './components/admin/AdminDelivery';
import { AdminExpenses } from './components/admin/AdminExpenses';
import { AdminFinances } from './components/admin/AdminFinances';
import { AdminReports } from './components/admin/AdminReports';
import { AdminPromotions } from './components/admin/AdminPromotions';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminHomepage } from './components/admin/AdminHomepage';
import { AdminPayments } from './components/admin/AdminPayments';

export default function App() {
  // Every page has its own address (see lib/router): refresh stays put, Back goes to the previous page
  const { route, navigate, back, navKey, scroll } = useRouter();
  const goAdminTab = (tab: AdminTab) => navigate(`/admin/${tab}`);

  // Authenticated Staff Session (Null if guest / customer)
  const [authenticatedStaff, setAuthenticatedStaff] = useState<StaffUser | null>(() => {
    return storeRepo.getAuthenticatedStaff();
  });

  // Language: Default to English ('en') as requested by user
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('milgo_lang') as Language) || 'en';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('milgo_lang', newLang);
  };

  // Vision Mode: 'night' | 'light'
  const [theme, setTheme] = useState<'night' | 'light'>(() => {
    return (localStorage.getItem('milgo_theme') as 'night' | 'light') || 'night';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'night' ? 'light' : 'night';
    setTheme(nextTheme);
    localStorage.setItem('milgo_theme', nextTheme);
  };

  // Apply the theme on <html> so storefront, ERP, modals and the page background all switch together
  useEffect(() => {
    document.documentElement.classList.toggle('theme-night', theme === 'night');
  }, [theme]);

  // Store Settings & Products
  const [settings, setSettings] = useState<StoreSettings>(() => storeRepo.getSettings());
  const [products, setProducts] = useState<Product[]>(() => storeRepo.getProducts());

  // Customer Shopping State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('milgo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milgo_wishlist');
      return saved ? JSON.parse(saved) : ['prod-001'];
    } catch {
      return ['prod-001'];
    }
  });

  // Coupons
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string>('');

  // Drawers & overlays (product, checkout and tracker are routes, so Back closes them)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const quickViewProduct = route.name === 'product' ? products.find((p) => p.id === route.id) ?? null : null;
  const isCheckoutOpen = route.name === 'checkout' && cart.length > 0;
  const openProduct = (prod: Product) => navigate(`/product/${prod.id}`, { scroll: 'none' });

  // Apply the scroll that goes with a link: new pages start at the top, shop links jump to the catalogue.
  // Back/Forward and refresh are left to the browser, which restores the previous position.
  useEffect(() => {
    if (scroll.intent === 'none') return;
    requestAnimationFrame(() => {
      if (scroll.intent === 'catalog') document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0 });
    });
  }, [scroll.key]);

  // Redirects: signed-in staff skip the login form; an empty bag has no checkout
  useEffect(() => {
    if (route.name === 'login' && authenticatedStaff) navigate(route.next ?? '/admin/dashboard', { replace: true });
    if (route.name === 'checkout' && cart.length === 0) navigate('/', { replace: true, scroll: 'none' });
  }, [route, authenticatedStaff, cart.length]);

  // Opened on a shop address (e.g. after refresh): bring the catalogue into view once it has rendered
  useEffect(() => {
    if (route.name === 'shop' && scroll.key === 0) {
      setTimeout(() => document.getElementById('catalog-section')?.scrollIntoView(), 50);
    }
  }, []);

  // Sync cart & wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('milgo_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('milgo_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn(e);
    }
  }, [wishlist]);

  // Cart actions
  const handleAddToCart = (product: Product, variant: ProductVariant, quantity = 1) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (i) => i.productId === product.id && i.variantId === variant.id
      );

      const price = variant.discountPrice || variant.sellingPrice;

      if (existingIdx >= 0) {
        const copy = [...prevCart];
        const newQty = Math.min(variant.stockQuantity, copy[existingIdx].quantity + quantity);
        copy[existingIdx].quantity = newQty;
        return copy;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          brand: product.brand,
          size: variant.size,
          image: product.images[0],
          unitPrice: price,
          quantity: Math.min(variant.stockQuantity, quantity),
          availableStock: variant.stockQuantity,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.variantId === variantId) {
          return { ...item, quantity: Math.min(item.availableStock, quantity) };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string, variantId: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  };

  // Direct Buy Now
  const handleBuyNow = (product: Product, variant: ProductVariant, quantity = 1) => {
    handleAddToCart(product, variant, quantity);
    navigate('/checkout', { replace: true, scroll: 'none' });
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Coupons
  const handleApplyCoupon = (code: string) => {
    const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const result = storeRepo.validateCoupon(code, subtotal);
    if (result.valid) {
      setAppliedCoupon(code.toUpperCase());
      setCouponDiscount(result.discountAmount);
      setCouponMessage(result.message);
    } else {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage('');
  };

  // Order submission
  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    // Replace the checkout address so Back cannot reopen a finished checkout
    navigate('/', { replace: true, scroll: 'none' });
    setIsCartOpen(false);
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    // Refresh products stock in state
    setProducts(storeRepo.getProducts());
  };

  // Catalogue filter follows the address (#/shop/men, #/shop/family/Citrus); navKey re-applies it on Back/Forward
  const catalogPreset =
    route.name === 'shop' ? { family: route.family, gender: route.gender, nonce: navKey } : undefined;

  // Header / hero links
  const handleNavigateSection = (section: string) => {
    if (section === 'home') navigate('/', { scroll: 'top' });
    else if (section === 'Men') navigate('/shop/men', { scroll: 'catalog' });
    else if (section === 'Women') navigate('/shop/women', { scroll: 'catalog' });
    else navigate('/shop', { scroll: 'catalog' });
  };

  const handleOpenTracker = (orderId?: string) => navigate(orderId ? `/track/${orderId}` : '/track', { scroll: 'none' });

  const handleOpenAdminPortal = () => navigate(authenticatedStaff ? '/admin/dashboard' : '/staff-login');

  const handleLoginSuccess = (user: StaffUser) => {
    setAuthenticatedStaff(user);
    navigate(route.name === 'login' && route.next ? route.next : '/admin/dashboard', { replace: true });
  };

  const handleLogout = () => {
    storeRepo.logoutStaff();
    setAuthenticatedStaff(null);
    navigate('/');
  };

  // Render Admin Authentication Portal Gate
  if (route.name === 'login' && authenticatedStaff) return null; // redirected by the effect above
  if (route.name === 'login') {
    return (
      <>
        <AdminLogin
          settings={settings}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLoginSuccess={handleLoginSuccess}
          onBackToStore={() => back('/')}
        />
      </>
    );
  }

  // Render Admin ERP view (Strictly protected by authentication)
  if (route.name === 'admin') {
    const adminTab = route.tab as AdminTab;
    if (!authenticatedStaff) {
      return (
        <>
          <AdminLogin
            settings={settings}
            lang={lang}
            onLanguageChange={handleLanguageChange}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onLoginSuccess={handleLoginSuccess}
            onBackToStore={() => navigate('/')}
          />
        </>
      );
    }

    // Only show pages the signed-in role may open; fall back to the first allowed page
    const allowedTabs = ADMIN_TABS.filter((t) => storeRepo.can(t, authenticatedStaff));
    const activeTab: AdminTab | undefined = allowedTabs.includes(adminTab) ? adminTab : allowedTabs[0];

    return (
      <>
        <AdminLayout
          currentTab={activeTab ?? adminTab}
          onTabChange={goAdminTab}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          settings={settings}
          staffUser={authenticatedStaff}
          onLogout={handleLogout}
          onExitToStore={() => {
            setProducts(storeRepo.getProducts());
            setSettings(storeRepo.getSettings());
            navigate('/');
          }}
        >
          {!activeTab && (
            <p className="text-sm text-fg-3">
              {lang === 'so' ? 'Doorkaagu weli wax ogolaansho ah ma laha. La xiriir milkiilaha.' : 'Your role has no access yet. Contact the owner.'}
            </p>
          )}
          {activeTab === 'dashboard' && (
            <AdminDashboard lang={lang} settings={settings} onNavigateTab={goAdminTab} />
          )}
          {activeTab === 'products' && <AdminProducts lang={lang} />}
          {activeTab === 'inventory' && <AdminInventory lang={lang} />}
          {activeTab === 'purchases' && <AdminPurchases lang={lang} />}
          {activeTab === 'orders' && <AdminOrders lang={lang} settings={settings} />}
          {activeTab === 'delivery' && <AdminDelivery lang={lang} settings={settings} />}
          {activeTab === 'expenses' && <AdminExpenses lang={lang} />}
          {activeTab === 'finances' && <AdminFinances lang={lang} settings={settings} />}
          {activeTab === 'reports' && <AdminReports lang={lang} />}
          {activeTab === 'promotions' && <AdminPromotions lang={lang} />}
          {activeTab === 'users' && <AdminUsers lang={lang} />}
          {activeTab === 'payments' && (
            <AdminPayments lang={lang} onSettingsUpdated={(newSettings) => setSettings(newSettings)} />
          )}
          {activeTab === 'hero' && (
            <AdminHomepage lang={lang} onSettingsUpdated={(newSettings) => setSettings(newSettings)} />
          )}
          {activeTab === 'settings' && (
            <AdminSettings
              lang={lang}
              settings={settings}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}
        </AdminLayout>
      </>
    );
  }

  // Render Luxury Customer Storefront
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`min-h-screen bg-canvas text-fg flex flex-col font-sans selection:bg-[#c8a97e]/30 selection:text-fg transition-colors duration-200`}>
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar settings={settings} lang={lang} />

      {/* 2. Top Bar Navigation (Strict 3-Zone Contract) */}
      <Header
        settings={settings}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isAuthenticated={Boolean(authenticatedStaff)}
        authenticatedStaffName={authenticatedStaff?.name}
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => {
          handleNavigateSection('catalog');
        }}
        onOpenSearch={() => {
          handleNavigateSection('catalog');
        }}
        onNavigateSection={handleNavigateSection}
        onOpenAdmin={handleOpenAdminPortal}
        onOpenTrackOrder={() => handleOpenTracker()}
      />

      {route.name === 'page' ? (
        <PolicyPage page={route.page} lang={lang} onBack={() => back('/')} />
      ) : (
        <>
      {/* 3. Hero Showcase */}
      <Hero
        lang={lang}
        slides={settings.heroSlides}
        products={products}
        onViewProduct={openProduct}
        onExplore={() => handleNavigateSection('catalog')}
        onBestsellers={() => handleNavigateSection('catalog')}
      />

      {/* 4. Curated Olfactory Collections */}
      <FeaturedCollections
        lang={lang}
        collections={settings.collections}
        onSelectFamily={(family) => navigate(family === 'All' ? '/shop' : `/shop/family/${encodeURIComponent(family)}`, { scroll: 'catalog' })}
      />

      {/* 5. Complete Product Catalog */}
      <ProductCatalog
        products={products}
        lang={lang}
        onQuickView={openProduct}
        onAddToCart={(prod, variant) => {
          handleAddToCart(prod, variant, 1);
          setIsCartOpen(true);
        }}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        preset={catalogPreset}
      />
        </>
      )}

      {/* 6. Footer */}
      <Footer
        settings={settings}
        lang={lang}
        onOpenPolicy={(policy) => navigate(`/${policy}`)}
        onOpenAdmin={handleOpenAdminPortal}
      />

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        lang={lang}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout', { scroll: 'none' });
        }}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        couponMessage={couponMessage}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        lang={lang}
        settings={settings}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => back('/')}
        onAddToCart={(prod, variant, qty) => {
          handleAddToCart(prod, variant, qty);
          setIsCartOpen(true);
        }}
        onBuyNow={handleBuyNow}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => back('/')}
        items={cart}
        lang={lang}
        settings={settings}
        deliveryZones={storeRepo.getDeliveryZones()}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmed Success Screen */}
      <OrderSuccessModal
        order={confirmedOrder}
        lang={lang}
        settings={settings}
        isOpen={Boolean(confirmedOrder)}
        onClose={() => setConfirmedOrder(null)}
        onTrackOrder={(orderId) => handleOpenTracker(orderId)}
      />

      {/* Order Tracker Modal */}
      {route.name === 'track' && (
        <OrderTrackerModal
          key={route.orderId ?? 'search'}
          isOpen
          onClose={() => back('/')}
          lang={lang}
          settings={settings}
          initialOrderId={route.orderId}
        />
      )}

    </div>
  );
}
