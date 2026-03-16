import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
    setPaymentSuccess(true);
    // Payment successful, now create the order
    setSubmitting(true);
    try {
      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, {
        userId: user?.uid || null,
        userEmail: user?.email || form.email,
        customer: form,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        createdAt: serverTimestamp(),
        status: paymentMethod === "cod" ? "pending" : "paid",
        paymentMethod: paymentMethod,
        paymentData: paymentData || null,
      });
      setOrderId(docRef.id);
      setCartItems([]);
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
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="payment-form-section">
                <UPIPayment
                  amount={subtotal}
                  orderId={`ORDER_${Date.now()}`}
                  merchantId="yourupiid@bank" // Replace with your actual UPI ID (e.g., merchant@paytm, user@hdfcbank)
                  merchantName="Your Business Name"
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

