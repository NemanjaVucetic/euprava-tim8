import { Navigate, useLocation } from "react-router-dom";

type AppRole = "CITIZEN" | "MUP" | "TRAFFIC";

type Props = {
  role?: AppRole;
  roles?: AppRole[];
  children: React.ReactNode;
};

function getStoredRole(): AppRole | null {
  const role = (localStorage.getItem("role") || "").trim().toUpperCase();
  if (role === "CITIZEN" || role === "MUP" || role === "TRAFFIC") return role;
  return null;
}

export default function RequireRole({ role, roles, children }: Props) {
  const location = useLocation();
  const storedRole = getStoredRole();
  const allowedRoles = roles?.length ? roles : role ? [role] : [];

  if (!storedRole) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(storedRole)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
