import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import ProductList from "./components/ProductList.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import CartPage from "./components/CartPage.jsx";
import CheckoutPage from "./components/CheckoutPage.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import AuthPage from "./components/AuthPage.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { CartContext } from "./context/CartContext.jsx";
import { ProductProvider } from "./context/ProductContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const [products, setProducts] = useState([]);

  const productValue = useMemo(
    () => ({ products, setProducts }),
    [products]
  );

  return (
    <AuthProvider>
      <ProductProvider value={productValue}>
        <AppContent />
      </ProductProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();

  const cartStorageKey = useMemo(
    () => `cartItems_${user?.uid ?? "guest"}`,
    [user?.uid]
  );

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem(cartStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const saved = localStorage.getItem(cartStorageKey);
    if (saved) {
      setCartItems(JSON.parse(saved));
    } else {
      setCartItems([]);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  }, [cartItems, cartStorageKey]);

  const cartValue = useMemo(
    () => ({ cartItems, setCartItems }),
    [cartItems]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={cartValue}>
      <div className="app-shell">
        <SiteHeader cartCount={cartCount} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <RequireUser>
                  <CheckoutPage />
                </RequireUser>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireUser>
                  <OrderHistory />
                </RequireUser>
              }
            />
            <Route path="/account" element={<AuthPage />} />
            <Route
              path="/profile"
              element={
                <RequireUser>
                  <ProfilePage />
                </RequireUser>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPanel />
                </RequireAdmin>
              }
            />
          </Routes>
        </main>
        <footer className="footer">
          <span>© {new Date().getFullYear()} Doodle Garden</span>
        </footer>
      </div>
    </CartContext.Provider>
  );
}

function SiteHeader({ cartCount }) {
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setMobileOpen((prev) => !prev);

  return (
    <header className="top-nav">
      <div className="brand">Doodle Garden</div>

      <button
        className={`nav-toggle ${mobileOpen ? "open" : ""}`}
        onClick={handleToggle}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${mobileOpen ? "open" : ""}`}>
        <NavLink to="/" end onClick={() => setMobileOpen(false)}>
          Store
        </NavLink>
        <NavLink to="/cart" onClick={() => setMobileOpen(false)}>
          Cart ({cartCount})
        </NavLink>
        {user && (
          <NavLink to="/orders" onClick={() => setMobileOpen(false)}>
            Orders
          </NavLink>
        )}
        {user && isAdmin && (
  <NavLink to="/admin" onClick={() => setMobileOpen(false)}>
    Admin
  </NavLink>
)}
        {user ? (
          <>
            <NavLink to="/profile" onClick={() => setMobileOpen(false)}>
              Profile
            </NavLink>
            
          </>
        ) : (
          <NavLink to="/account" onClick={() => setMobileOpen(false)}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
}

function RequireAdmin({ children }) {
  const { user, isAdmin, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <p className="muted small">Checking your session…</p>;
  }

  if (!user || !isAdmin) {
    return (
      <Navigate
        to="/account"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  return children;
}

function RequireUser({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <p>Loading...</p>;
  if (!user) return <Navigate to="/account" state={{ from: location.pathname }} />;
  return children;
}


