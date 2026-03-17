import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase.js";
import UPIPayment from "./UPIPayment.jsx";

export default function CheckoutPage() {
  const { cartItems, setCartItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [step, setStep] = useState(1); // 1: shipping, 2: payment
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [orderError, setOrderError] = useState(null);
  const [upiMerchantId, setUpiMerchantId] = useState("tkabhishek45@oksbi");
  const [upiMerchantName, setUpiMerchantName] = useState("tkabhishek45");
  const [upiOpened, setUpiOpened] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (user && !form.email) {
      setForm((prev) => ({ ...prev, email: user.email || prev.email }));
    }
  }, [user, form.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSuccess = async (paymentData) => {
    setOrderError(null);
    setPaymentSuccess(true);
    // Payment successful, now create the order and update stock
    setSubmitting(true);

    console.log("Placing order as", user?.uid, user?.email);

    try {
      const orderRef = doc(collection(db, "orders"));
      const items = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await runTransaction(db, async (tx) => {
        // Read all product documents first (Firestore requires all reads before any writes in a transaction)
        const productRefs = items.map((item) => doc(db, "products", item.id));
        const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

        // Then perform writes (stock updates)
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const productSnap = productSnaps[i];
          if (!productSnap.exists()) continue;
          const currentStock = productSnap.data().stock || 0;
          tx.update(productRefs[i], {
            stock: Math.max(0, currentStock - item.quantity),
          });
        }

        tx.set(orderRef, {
          userId: user?.uid || null,
          userEmail: user?.email || form.email,
          customer: form,
          items,
          subtotal,
          createdAt: serverTimestamp(),
          status: paymentMethod === "cod" ? "pending" : "paid",
          paymentMethod: paymentMethod,
          paymentData: paymentData || null,
        });
      });

      setOrderId(orderRef.id);
      setCartItems([]);
    } catch (err) {
      console.error("Error placing order:", err);
      const code = err?.code ? `${err.code}: ` : "";
      const message = err?.message || "Failed to place order. Please try again.";
      const display = `${code}${message}`;
      setOrderError(display);
      alert(`Order failed: ${display}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartItems.length && !orderId) {
    return (
      <section>
        <div className="page-header">
          <h1>Checkout</h1>
        </div>
        <p className="muted">Your cart is empty. Add items before checkout.</p>
      </section>
    );
  }

  if (orderId) {
    return (
      <section className="checkout-complete">
        <h1>Thank you for your order!</h1>
        <p className="muted">
          {paymentMethod === "cod" 
            ? "Your order has been placed. You will pay when your order is delivered."
            : "Your payment has been processed and your order will be shipped shortly."
          }
        </p>
        <div className="order-box">
          <span className="label">Order ID</span>
          <span className="value">{orderId}</span>
        </div>
        <button className="btn primary" onClick={() => navigate("/")}>
          Back to store
        </button>
      </section>
    );
  }

  return (
    <section className="checkout-layout">
      <div className="page-header">
        <div>
          <h1>Checkout</h1>
          <p className="muted">
            Step {step} of 2: {step === 1 ? "Shipping details" : "Payment"}
          </p>
        </div>
      </div>
      <div className="checkout-grid">
        {step === 1 ? (
          <form className="card form-card" onSubmit={handleShippingSubmit}>
            <h2>Shipping details</h2>
            <div className="form-grid">
              <label>
                Full name
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </label>
              <label className="full-width">
                Address
                <input
                  name="address"
                  required
                  value={form.address}
                  onChange={handleChange}
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                />
              </label>
              <label>
                Country
                <input
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                />
              </label>
              <label>
                Postal code
                <input
                  name="postalCode"
                  required
                  value={form.postalCode}
                  onChange={handleChange}
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn primary full-width"
            >
              Continue to Payment
            </button>
          </form>
        ) : (
          <div className="card form-card">
            <h2>Payment Method</h2>
            
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="option-content">
                  <strong>Credit/Debit Card</strong>
                  <small>Pay securely with your card</small>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="option-content">
                  <strong>UPI</strong>
                  <small>Pay using UPI apps (Google Pay, PhonePe, etc.)</small>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="option-content">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when you receive your order</small>
                </span>
              </label>
            </div>

            {paymentMethod === "card" && (
              <div className="payment-form-section">
                <p className="muted">Payment integration coming soon. Click "Complete Order" to simulate card payment.</p>
                <button
                  className="btn primary full-width"
                  onClick={() => handlePaymentSuccess({ id: "simulated_card_payment" })}
                  disabled={submitting}
                >
                  {submitting ? "Processing…" : `Pay ${paymentMethod === "upi" ? "₹" : "$"}${subtotal.toFixed(2)} with Card`}
                </button>
                {orderError && (
                  <p className="muted" style={{ color: "#f97373", marginTop: "0.75rem" }}>
                    {orderError}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="payment-form-section">
                <label className="full-width">
                  UPI ID
                  <input
                    value={upiMerchantId}
                    onChange={(e) => setUpiMerchantId(e.target.value)}
                    placeholder="merchant@bank"
                  />
                </label>
                <label className="full-width">
                  Merchant Name
                  <input
                    value={upiMerchantName}
                    onChange={(e) => setUpiMerchantName(e.target.value)}
                    placeholder="Your Business Name"
                  />
                </label>
                <UPIPayment
                  amount={subtotal}
                  orderId={`ORDER_${Date.now()}`}
                  merchantId={upiMerchantId}
                  merchantName={upiMerchantName}
                  onSuccess={() => handlePaymentSuccess({ id: "upi_payment_completed", method: "upi" })}
                  onCancel={() => setPaymentMethod("card")}
                />
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="payment-form-section">
                <p className="muted">You will pay when your order is delivered.</p>
                <button
                  className="btn primary full-width"
                  onClick={() => handlePaymentSuccess({ type: "cash_on_delivery" })}
                  disabled={submitting}
                >
                  {submitting ? "Processing…" : `Place Order - Pay on Delivery`}
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn ghost"
              onClick={() => setStep(1)}
              style={{ marginTop: "1rem" }}
            >
              ← Back to shipping
            </button>
          </div>
        )}
        <aside className="card order-summary">
          <h2>Order summary</h2>
          <ul className="mini-cart">
            {cartItems.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{paymentMethod === "upi" ? "₹" : "$"}{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row total">
            <span>Total</span>
            <span>{paymentMethod === "upi" ? "₹" : "$"}{subtotal.toFixed(2)}</span>
          </div>
          <p className="muted tiny">
            Orders are stored in Firestore for this demo. No real payments are
            processed.
          </p>
        </aside>
      </div>
    </section>
  );
}

