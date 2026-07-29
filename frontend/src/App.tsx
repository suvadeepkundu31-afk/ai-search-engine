import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ParticleBackground from "./components/ParticleBackground";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Layout from "./components/Layout";
import Search from "./components/Search";
import Chat from "./components/Chat";
import DocumentList from "./components/DocumentList";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Zeee…</div>;
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ParticleBackground />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              backdropFilter: "blur(12px)",
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Search />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:sessionId" element={<Chat />} />
            <Route path="documents" element={<DocumentList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
