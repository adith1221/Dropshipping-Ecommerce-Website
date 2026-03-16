import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { user } = useAuth();
  const { cartItems, setCartItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    if (!id) return;
    setLoadingReviews(true);

    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("productId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setReviews(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoadingReviews(false);
      },
      (error) => {
        console.error("Error loading reviews:", error);
        setLoadingReviews(false);
      }
    );

    return unsub;
  }, [id]);

  if (!product) {
    return (
      <section>
        <div className="page-header">
          <h1>Product Not Found</h1>
          <p className="muted">The product you're looking for doesn't exist.</p>
          <button className="btn primary" onClick={() => navigate("/")}>
            Back to Store
          </button>
        </div>
      </section>
    );
  }

  const addToCart = () => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    navigate("/cart");
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please sign in to leave a review.");
      return;
    }
    if (!comment.trim()) {
      alert("Please enter a review message.");
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const reviewPayload = {
        productId: product.id,
        userId: user.uid,
        userEmail: user.email,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      };
      console.log("Submitting review payload:", reviewPayload);
      await addDoc(reviewsRef, reviewPayload);

      setComment("");
      setRating(5);
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert(`Failed to submit review: ${error.code || error.message || error}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const inCartQty = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  return (
    <section>
      <div className="page-header">
        <button className="btn ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
      <div className="product-detail">
        <div className="product-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-info">
          <span className="pill">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="price">${product.price}</div>
          {inCartQty > 0 && (
            <p className="muted small">Already in cart: {inCartQty}</p>
          )}
          <div className="quantity-selector">
            <label>Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <button className="btn primary" onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      </div>

      <div className="reviews-section" style={{ marginTop: "2rem" }}>
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews">
            <div className="review-summary" style={{ marginBottom: "1rem" }}>
              <strong>{reviews.length}</strong> review{reviews.length === 1 ? "" : "s"}
              {reviews.length > 0 && (
                <span style={{ marginLeft: "1rem" }}>
                  Average rating: {(
                    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                    reviews.length
                  ).toFixed(1)} / 5
                </span>
              )}
            </div>
            <div className="review-list">
              {reviews
                .slice()
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
                .map((review, index) => (
                  <div key={index} className="review">
                    <div className="review-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="muted small">{review.userEmail || "Anonymous"}</span>
                      <span className="muted small">
                        {Array.from({ length: review.rating || 0 }).map((_, i) => "★").join("")}
                        {Array.from({ length: 5 - (review.rating || 0) }).map((_, i) => "☆").join("")}
                      </span>
                    </div>
                    <p style={{ margin: "0.25rem 0" }}>{review.comment}</p>
                    <div className="muted tiny">
                      {review.createdAt?.toDate
                        ? review.createdAt.toDate().toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <p className="muted">No reviews yet. Be the first to leave one!</p>
        )}

        <div className="review-form" style={{ marginTop: "1.5rem" }}>
          <h3>Leave a review</h3>
          {user ? (
            <>
              <div className="form-grid" style={{ gap: "0.75rem" }}>
                <label>
                  Rating
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  Review
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product"
                  />
                </label>
              </div>
              <button
                className="btn primary"
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting…" : "Submit review"}
              </button>
            </>
          ) : (
            <p className="muted">
              Please sign in to leave a review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}