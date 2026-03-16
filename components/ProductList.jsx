import { useProducts } from "../context/ProductContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

export default function ProductList() {
  const { products } = useProducts();
  const { cartItems, setCartItems } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const inCartQty = (id) =>
    cartItems.find((item) => item.id === id)?.quantity ?? 0;

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Storefront</h1>
          <p className="muted">
            Curated dropshipping products with a clean, modern shopping
            experience.
          </p>
        </div>
      </div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="card"
            onClick={() => navigate(`/product/${product.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="card-image-wrapper">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="card-body">
              <span className="pill">{product.category}</span>
              <h2>{product.name}</h2>
              <p className="muted small">{product.description}</p>
            </div>
            <div className="card-footer">
              <div className="price">${product.price}</div>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
              >
                Add to cart
              </button>
            </div>
            {inCartQty(product.id) > 0 && (
              <div className="badge">In cart: {inCartQty(product.id)}</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

