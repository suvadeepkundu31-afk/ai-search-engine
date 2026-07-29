import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MessageSquare, Files, LogOut, Moon, Sun, Zap } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/", icon: Search, label: "Search" },
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/documents", icon: Files, label: "Documents" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen flex flex-col">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass border-b-0 rounded-none"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Zeee</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${active ? "text-white" : "text-slate-400 hover:text-slate-100"}`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-xl text-slate-400 hover:bg-white/10 transition"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <span className="max-w-[100px] truncate">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.nav>

      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
}
