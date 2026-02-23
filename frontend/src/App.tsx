import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import RequireRole from "./api/RequireRole";
import ChecksPage from "./pages/ChecksPage";
import LoginPage from "./pages/LoginPage";
import MupVehiclesPage from "./pages/MupVehicles";
import MyViolationsPage from "./pages/MyViolationsPage";
import PoliceManagementPage from "./pages/PoliceManagementPage";
import TrafficPoliceDashboardPage from "./pages/TrafficPoliceDashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import UsersRolesPage from "./pages/UsersRolesPage";
import ViolationsPage from "./pages/ViolationsPage";

type AppRole = "CITIZEN" | "MUP" | "TRAFFIC";

function getStoredUser() {
  const email = localStorage.getItem("email");
  return email && email.trim().length > 0 ? email : null;
}

function getStoredRole(): AppRole | null {
  const role = (localStorage.getItem("role") || "").trim().toUpperCase();
  if (role === "CITIZEN" || role === "MUP" || role === "TRAFFIC") return role;
  return null;
}

function getRoleFromToken(): AppRole | null {
  const token = localStorage.getItem("accessToken") || "";
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const role = String(payload?.role || "").trim().toUpperCase();
    if (role === "CITIZEN" || role === "MUP" || role === "TRAFFIC") return role;
  } catch {
    return null;
  }

  return null;
}

function getEffectiveRole(): AppRole | null {
  return getRoleFromToken() || getStoredRole();
}

function getDefaultRouteForRole(role: AppRole | null): string {
  if (role === "CITIZEN") return "/my-violations";
  if (role === "MUP") return "/traffic";
  return "/traffic";
}

function Layout({
  user,
  role,
  onLogout,
  children,
}: {
  user: string;
  role: AppRole | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const homeRoute = getDefaultRouteForRole(role);

  function handleLogout() {
    onLogout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to={homeRoute} className="font-semibold hover:text-indigo-400">
              e-Uprava
            </Link>

            <nav className="flex gap-4 text-sm text-slate-300">
              {(role === "MUP" || role === "TRAFFIC") && (
                <Link to="/mup" className="hover:text-white">
                  MUP Vozila
                </Link>
              )}
              {role === "TRAFFIC" && (
                <Link to="/traffic/police" className="hover:text-white">
                  Policija
                </Link>
              )}
              {role === "TRAFFIC" && (
                <Link to="/traffic/violations" className="hover:text-white">
                  Prekrsaji
                </Link>
              )}
              {role === "TRAFFIC" && (
                <Link to="/traffic/checks" className="hover:text-white">
                  Provere
                </Link>
              )}
              {role === "CITIZEN" && (
                <Link to="/my-violations" className="hover:text-white">
                  Moji prekrsaji
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{user}</span>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 hover:bg-white/10"
            >
              Odjava
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<string | null>(() => getStoredUser());
  const [role, setRole] = useState<AppRole | null>(() => getEffectiveRole());

  useEffect(() => {
    setRole(getEffectiveRole());
  }, [user]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
  };

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (!user || !role) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  const homeRoute = role ? getDefaultRouteForRole(role) : "/login";

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user && role ? (
              <Navigate to={homeRoute} replace />
            ) : (
              <LoginPage
                onLogin={(email, loggedInRole) => {
                  localStorage.setItem("email", email);
                  localStorage.setItem("role", loggedInRole);
                  setUser(email);
                  setRole(loggedInRole);
                }}
              />
            )
          }
        />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout user={user!} role={role} onLogout={logout}>
                <Routes>
                  <Route path="/" element={<Navigate to={homeRoute} replace />} />

                  <Route
                    path="/mup"
                    element={
                      <RequireRole roles={["MUP", "TRAFFIC"]}>
                        <MupVehiclesPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/traffic"
                    element={
                      <RequireRole roles={["TRAFFIC", "MUP"]}>
                        <TrafficPoliceDashboardPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/traffic/police"
                    element={
                      <RequireRole role="TRAFFIC">
                        <PoliceManagementPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/traffic/violations"
                    element={
                      <RequireRole role="TRAFFIC">
                        <ViolationsPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <RequireRole role="TRAFFIC">
                        <UsersRolesPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/traffic/checks"
                    element={
                      <RequireRole role="TRAFFIC">
                        <ChecksPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/my-violations"
                    element={
                      <RequireRole role="CITIZEN">
                        <MyViolationsPage />
                      </RequireRole>
                    }
                  />

                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="*" element={<Navigate to={homeRoute} replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
