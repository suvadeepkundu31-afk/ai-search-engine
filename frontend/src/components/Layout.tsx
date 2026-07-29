import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <Link to="/" className="brand">AI Search</Link>
        <div className="nav-links">
          <Link to="/">Search</Link>
          <Link to="/chat">Chat</Link>
          <Link to="/documents">Documents</Link>
        </div>
        <div className="nav-user">
          {user ? (
            <>
              <span>{user.username}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
