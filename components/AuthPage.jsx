import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    (location.state && location.state.from) ||
    (location.state && location.state.fromPath) ||
    "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password);
      }
      navigate(from, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="checkout-complete" style={{ maxWidth: 420 }}>
      <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="muted small">
        {mode === "login"
          ? "Sign in to place orders and view your history."
          : "Create an account with email and password."}
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
          <p className="muted tiny" style={{ color: "#85f973" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn primary full-width"
          disabled={submitting}
        >
          {submitting
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
            ? "Sign in"
            : "Sign up"}
        </button>
      </form>
      <p className="muted tiny">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="link-button"
          onClick={() =>
            setMode((m) => (m === "login" ? "register" : "login"))
          }
        >
          {mode === "login" ? "Create an account" : "Sign in instead"}
        </button>
      </p>
    </section>
  );
}

