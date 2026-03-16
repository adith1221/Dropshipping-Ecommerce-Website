import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import ProductList from "./components/ProductList.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import CartPage from "./components/CartPage.jsx";
import CheckoutPage from "./components/CheckoutPage.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import AuthPage from "./components/AuthPage.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { CartContext } from "./context/CartContext.jsx";
import { ProductProvider } from "./context/ProductContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const cartValue = useMemo(
    () => ({ cartItems, setCartItems }),
    [cartItems]
  );

  const productValue = useMemo(
    () => ({ products, setProducts }),
    [products]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthProvider>
      <ProductProvider value={productValue}>
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
      </ProductProvider>
    </AuthProvider>
  );
}

function SiteHeader({ cartCount }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <header className="top-nav">
      <div className="brand">Doodle Garden</div>
      <nav className="nav-links">
        <NavLink to="/" end>
          Store
        </NavLink>
        <NavLink to="/cart">Cart ({cartCount})</NavLink>
        {user && <NavLink to="/orders">Orders</NavLink>}
        <NavLink to="/admin">Admin</NavLink>
        {user ? (
          <>
            <span className="tiny muted">
              {user.email?.split("@")[0] || "Account"}
            </span>
            <button className="btn ghost" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/account">Login</NavLink>
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


