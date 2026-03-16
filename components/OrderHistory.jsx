import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase.js";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "cancelled" });
      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (!user) {
    return (
      <section>
        <div className="page-header">
          <h1>Order History</h1>
          <p className="muted">Please log in to view your orders.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <div className="page-header">
          <h1>Order History</h1>
          <p className="muted">Loading your orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <h1>Order History</h1>
        <p className="muted">Your past orders and purchases.</p>
      </div>
      {orders.length === 0 ? (
        <p className="muted">No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id.slice(-8)}</h3>
                <span className="order-date">
                  {new Date(order.createdAt.toDate()).toLocaleDateString()}
                </span>
              </div>
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>Total: {order.paymentMethod === "upi" ? "₹" : "$"}{order.subtotal.toFixed(2)}</strong>
              </div>
              <div className="order-payment">
                Payment: {
                  order.paymentMethod === "card" && "💳 Credit/Debit Card"
                }
                {
                  order.paymentMethod === "upi" && "📱 UPI"
                }
                {
                  order.paymentMethod === "cod" && "💵 Cash on Delivery"
                }
                {!order.paymentMethod && "Not specified"}
              </div>
              <div className="order-status">
                Status: {order.status || "Processing"}
                {(order.status === "pending" || order.status === "processing" || !order.status) && (
                  <button 
                    className="link-button danger" 
                    onClick={() => cancelOrder(order.id)}
                    style={{ marginLeft: "1rem" }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}