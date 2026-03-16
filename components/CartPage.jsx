import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CartPage() {
  const { cartItems, setCartItems } = useCart();

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: quantity } : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Your Cart</h1>
          <p className="muted">
            Review your selections before proceeding to checkout.
          </p>
        </div>
        {cartItems.length > 0 && (
          <Link to="/checkout" className="btn primary">
            Continue to checkout
          </Link>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <p className="muted">Your cart is currently empty.</p>
          <Link to="/" className="btn ghost">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article key={item.id} className="cart-row">
                <div className="cart-main">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h2>{item.name}</h2>
                    <p className="muted small">{item.description}</p>
                    <button
                      className="link-button"
                      onClick={() => updateQuantity(item.id, 0)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-meta">
                  <span>${item.price}</span>
                  <div className="qty-control">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <span className="strong">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="muted">Calculated at checkout</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="btn primary full-width">
              Go to checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

