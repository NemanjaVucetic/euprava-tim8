import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import TrafficPoliceDashboardPage from "./pages/TrafficPoliceDashboardPage";
import PoliceManagementPage from "./pages/PoliceManagementPage";
import ViolationsPage from "./pages/ViolationsPage";
import UsersRolesPage from "./pages/UsersRolesPage";
import MupVehiclesPage from "./pages/MupVehicles";
import ChecksPage from "./pages/ChecksPage";

function getStoredUser() {
  const email = localStorage.getItem("email");
  return email && email.trim().length > 0 ? email : null;
}

function Layout({
  user,
  onLogout,
  children,
}: {
  user: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/traffic" className="font-semibold hover:text-indigo-400">
              e-Uprava
            </Link>

            <nav className="flex gap-4 text-sm text-slate-300">
              <Link to="/mup" className="hover:text-white">
                MUP Vozila
              </Link>
              <Link to="/traffic" className="hover:text-white">
                Saobraćaj
              </Link>
              <Link to="/traffic/police" className="hover:text-white">
                Policija
              </Link>
              <Link to="/traffic/violations" className="hover:text-white">
                Prekršaji
              </Link>
              <Link to="/traffic/checks" className="hover:text-white">
                Provere
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{user}</span>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<string | null>(() => getStoredUser());

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("email");
    setUser(null);
  };

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/traffic" replace />
            ) : (
              <LoginPage
                onLogin={(email) => {
                  localStorage.setItem("email", email);
                  setUser(email);
                }}
              />
            )
          }
        />

        {/* PROTECTED */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout user={user!} onLogout={logout}>
                <Routes>
                  <Route path="/" element={<Navigate to="/traffic" replace />} />
                  <Route path="/mup" element={<MupVehiclesPage />} />
                  <Route path="/traffic" element={<TrafficPoliceDashboardPage />} />
                  <Route path="/traffic/police" element={<PoliceManagementPage />} />
                  <Route path="/traffic/violations" element={<ViolationsPage />} />
                  <Route path="/admin/users" element={<UsersRolesPage />} />
                  <Route path="/traffic/checks" element={<ChecksPage />} />
                  <Route path="*" element={<Navigate to="/traffic" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
