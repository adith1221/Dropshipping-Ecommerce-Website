import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase.js";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";

export default function AdminReviews() {
  const { isAdmin } = useAuth();
  const [userId, setUserId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const reviewsRef = collection(db, "reviews");
    const q = userId.trim()
      ? query(reviewsRef, where("userId", "==", userId.trim()))
      : query(reviewsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setReviews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [isAdmin, userId]);

  if (!isAdmin) {
    return null;
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await deleteDoc(reviewRef);
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review. Please try again.");
    }
  };

  return (
    <div className="card">
      <h2>User Reviews</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID to filter reviews"
        />
      </div>
      {loading && <p className="muted">Loading reviews…</p>}
      {error && <p className="muted" style={{ color: "#f97373" }}>{error}</p>}
      {!loading && !error && (
        <div className="admin-table">
          <div className="table-header">
            <span>User</span>
            <span>Product</span>
            <span>Rating</span>
            <span>Comment</span>
            <span>Date</span>
            <span></span>
          </div>
          {reviews.map((review) => (
            <div key={review.id} className="table-row">
              <span className="muted small">{review.userEmail || review.userId}</span>
              <span className="muted small">{review.productId}</span>
              <span>{review.rating ?? "—"}</span>
              <span className="muted small" style={{ maxWidth: 240 }}>
                {review.comment}
              </span>
              <span className="muted small">
                {review.createdAt?.toDate
                  ? review.createdAt.toDate().toLocaleDateString()
                  : ""}
              </span>
              <span className="row-actions">
                <button
                  className="link-button danger"
                  onClick={() => deleteReview(review.id)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="muted small">No reviews found for that user.</p>
          )}
        </div>
      )}
    </div>
  );
}
