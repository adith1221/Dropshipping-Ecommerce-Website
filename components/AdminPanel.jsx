import { useState, useEffect } from "react";
import { useProducts } from "../context/ProductContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AdminOrders from "./AdminOrders.jsx";
import AdminReviews from "./AdminReviews.jsx";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function AdminPanel() {
  const { products, createProduct, updateProduct, removeProduct, uploadImage } =
    useProducts();
  const { user, isAdmin, initializing, login, logout, error } = useAuth();
  const [editingProduct, setEditingProduct] = useState(null);

  const emptyProduct = {
    id: "",
    name: "",
    description: "",
    price: "",
    image: "",
    category: "",
    stock: "",
  };

  const [form, setForm] = useState(emptyProduct);
  const [imageFile, setImageFile] = useState(null);

  const startCreate = () => {
    setEditingProduct(null);
    setForm({ ...emptyProduct, id: crypto.randomUUID() });
  };

  const startEdit = (product) => {
    setEditingProduct(product.id);
    setForm(product);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setImageFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (editingProduct) {
      await updateProduct(editingProduct, form, imageFile);
    } else {
      await createProduct(form, imageFile);
    }
    cancelEdit();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Remove this product?")) return;
    try {
      await removeProduct(id);
      if (editingProduct === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  if (initializing) {
    return (
      <section className="admin-layout">
        <p className="muted">Loading admin session…</p>
      </section>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <section className="admin-layout">
      <div className="page-header">
        <div>
          <h1>Admin Panel</h1>
          <p className="muted">
            Manage your product catalog for this dropshipping storefront.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="tiny muted">
            Signed in as {user.email || "admin"}
          </span>
          <button className="btn ghost" onClick={logout}>
            Sign out
          </button>
          <button className="btn primary" onClick={startCreate}>
            New product
          </button>
        </div>
      </div>
      <div className="admin-grid">
        <div className="card admin-table">
          <div className="table-header">
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span></span>
          </div>
          {products.map((p) => (
            <div key={p.id} className="table-row">
              <span>{p.name}</span>
              <span className="muted small">{p.category}</span>
              <span>${p.price}</span>
              <span>{p.stock || 0}</span>
              <span className="row-actions">
                <button className="link-button" onClick={() => startEdit(p)}>
                  Edit
                </button>
                <button
                  className="link-button danger"
                  onClick={() => deleteProduct(p.id)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
          {products.length === 0 && (
            <p className="muted small">No products yet. Create one to start.</p>
          )}
        </div>
        <form className="card form-card" onSubmit={handleSubmit}>
          <h2>{editingProduct ? "Edit product" : "Create product"}</h2>
          <div className="form-grid">
            <label className="full-width">
              Name
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
              />
            </label>
            <label className="full-width">
              Description
              <textarea
                name="description"
                rows={3}
                required
                value={form.description}
                onChange={handleChange}
              />
            </label>
            <label>
              Category
              <input
                name="category"
                required
                value={form.category}
                onChange={handleChange}
              />
            </label>
            <label>
              Price (USD)
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
              />
            </label>
            <label>
              Stock
              <input
                name="stock"
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={handleChange}
              />
            </label>
            <label className="full-width">
              Image URL (or upload new image)
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="Leave empty to use uploaded file"
              />
            </label>
            <label className="full-width">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editingProduct ? "Save changes" : "Create product"}
            </button>
            {editingProduct || form.id ? (
              <button
                type="button"
                className="btn ghost"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            ) : null}
          </div>
          <p className="muted tiny">
            Changes are persisted in Firestore. Restrict write access to admin
            users in your Firebase security rules.
          </p>
        </form>
      </div>
      <AdminOrders />
      <AdminReviews />
      <UserManagement />
      <CategoryManagement />
      <AnalyticsDashboard />
    </section>
  );
}

function AnalyticsDashboard() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(list);
    });

    const usersRef = collection(db, "users");
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalUsers = users.length;

  const bestSelling = {};
  orders.forEach(o => {
    o.items?.forEach(item => {
      bestSelling[item.name] = (bestSelling[item.name] || 0) + item.quantity;
    });
  });
  const bestSellingList = Object.entries(bestSelling).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="card">
      <h2>Analytics Dashboard</h2>
      <div className="analytics-grid">
        <div className="metric">
          <h3>Total Revenue</h3>
          <p className="large">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="metric">
          <h3>Total Orders</h3>
          <p className="large">{totalOrders}</p>
        </div>
        <div className="metric">
          <h3>Total Users</h3>
          <p className="large">{totalUsers}</p>
        </div>
        <div className="metric">
          <h3>Best Selling Products</h3>
          <ul>
            {bestSellingList.map(([name, qty]) => (
              <li key={name}>{name}: {qty} sold</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const categoriesRef = collection(db, "categories");
    const unsub = onSnapshot(categoriesRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(list);
    });
    return unsub;
  }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const categoriesRef = collection(db, "categories");
    await addDoc(categoriesRef, { name: newCategory.trim() });
    setNewCategory("");
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    const categoryRef = doc(db, "categories", id);
    await deleteDoc(categoryRef);
  };

  return (
    <div className="card">
      <h2>Category Management</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
        />
        <button className="btn primary" onClick={addCategory}>Add</button>
      </div>
      <div className="admin-table">
        <div className="table-header">
          <span>Name</span>
          <span></span>
        </div>
        {categories.map((c) => (
          <div key={c.id} className="table-row">
            <span>{c.name}</span>
            <span className="row-actions">
              <button className="link-button danger" onClick={() => deleteCategory(c.id)}>
                Delete
              </button>
            </span>
          </div>
        ))}
        {categories.length === 0 && <p className="muted small">No categories yet.</p>}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsub = onSnapshot(usersRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });
    return unsub;
  }, []);

  const toggleBlock = async (userId, blocked) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { blocked: !blocked });
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  };

  return (
    <div className="card admin-table">
      <h2>User Management</h2>
      <div className="table-header">
        <span>Email</span>
        <span>Created</span>
        <span>Blocked</span>
        <span></span>
      </div>
      {users.map((u) => (
        <div key={u.id} className="table-row">
          <span>{u.email}</span>
          <span className="muted small">{u.createdAt?.toDate().toLocaleDateString()}</span>
          <span>{u.blocked ? "Yes" : "No"}</span>
          <span className="row-actions">
            <button className="link-button" onClick={() => toggleBlock(u.id, u.blocked)}>
              {u.blocked ? "Unblock" : "Block"}
            </button>
            <button className="link-button danger" onClick={() => deleteUser(u.id)}>
              Delete
            </button>
          </span>
        </div>
      ))}
      {users.length === 0 && <p className="muted small">No users yet.</p>}
    </div>
  );
}

function AdminLogin() {
  const { user, login, register, error } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    // User is logged in but not admin
    return (
      <section className="checkout-complete" style={{ maxWidth: 420 }}>
        <h1>Admin Access Required</h1>
        <p className="muted small">
          To grant admin access, you must manually add a document to the "admins" collection in Firestore with your User ID as the document ID.
        </p>
        <div className="order-box">
          <div className="label">Your User ID:</div>
          <div className="value" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
            {user.uid}
          </div>
        </div>
        <p className="muted tiny">
          Copy this UID and create a document in Firestore Console → admins collection.
        </p>
        <button className="btn ghost" onClick={() => window.open("https://console.firebase.google.com", "_blank")}>
          Open Firebase Console
        </button>
      </section>
    );
  }

  return (
    <section className="checkout-complete" style={{ maxWidth: 420 }}>
      <h1>Admin {isRegister ? "Registration" : "Sign In"}</h1>
      <p className="muted small">
        {isRegister ? "Create an account to access admin features." : "Sign in to access admin features."}
      </p>
      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="full-width">
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
            Password
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </label>
        </div>
        {error && (
          <p className="muted tiny" style={{ color: "#f97373" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn primary full-width"
          disabled={submitting}
        >
          {submitting ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create Account" : "Sign In")}
        </button>
      </form>
      <button
        className="btn ghost"
        onClick={() => setIsRegister(!isRegister)}
        style={{ marginTop: "1rem" }}
      >
        {isRegister ? "Already have an account? Sign In" : "Need an account? Register"}
      </button>
    </section>
  );
}


