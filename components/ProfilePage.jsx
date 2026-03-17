import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <section>
        <div className="page-header">
          <h1>Profile</h1>
        </div>
        <p className="muted">You must be signed in to view your profile.</p>
        <Link to="/account" className="btn primary">
          Sign in
        </Link>
        <button className="btn ghost" onClick={logout}>
              Logout
            </button>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <h1>Your Profile</h1>
        <p className="muted">Manage your account information.</p>
      </div>
      <div className="card form-card" style={{ maxWidth: 460 }}>
        <div className="form-grid">
          <label className="full-width">
            UID
            <input value={user.uid} readOnly />
          </label>
          <label className="full-width">
            Email
            <input value={user.email || ""} readOnly />
          </label>
        </div>
        <button className="btn ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </section>
  );
}
