import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function AdminOrders() {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const ordersRef = collection(db, "orders");
    const unsub = onSnapshot(
      ordersRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [isAdmin]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  if (!isAdmin) {
    return <p>Access denied. Admin only.</p>;
  }

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="admin-orders">
      <h2>All Orders</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>User Email</th>
            <th>Order ID</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Payment</th>
            <th>Order Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order =>
            order.items.map((item, index) => (
              <tr key={`${order.id}-${index}`}>
                {index === 0 && (
                  <>
                    <td rowSpan={order.items.length}>{order.userName}</td>
                    <td rowSpan={order.items.length}>{order.userEmail}</td>
                    <td rowSpan={order.items.length}>{order.id.slice(0, 8)}</td>
                  </>
                )}
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{order.paymentMethod === "upi" ? "₹" : "$"}{item.price.toFixed(2)}</td>
                {index === 0 && (
                  <>
                    <td rowSpan={order.items.length}>
                      {order.paymentMethod === "card" && "💳 Card"}
                      {order.paymentMethod === "upi" && "📱 UPI"}
                      {order.paymentMethod === "cod" && "💵 COD"}
                      {!order.paymentMethod && "—"}
                    </td>
                    <td rowSpan={order.items.length}>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td rowSpan={order.items.length}>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td rowSpan={order.items.length}>
                      {/* Actions if needed */}
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {orders.length === 0 && <p>No orders yet.</p>}
    </div>
  );
}

