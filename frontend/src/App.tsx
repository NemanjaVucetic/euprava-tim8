import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import TrafficPolicePage from "./pages/TrafficPolicePage";
import AppShell from "./pages/AppShell";
import MupVehiclesPage from "./pages/MupVehicles";

type Tab = "mup" | "traffic";

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("mup");

  if (!user) {
    return <LoginPage onLogin={(u) => setUser(u)} />;
  }

  return (
    <AppShell
      user={user}
      active={tab}
      onNavigate={setTab}
      onLogout={() => {
        setUser(null);
        setTab("mup");
      }}
    >
      {tab === "mup" ? <MupVehiclesPage /> : <TrafficPolicePage />}
    </AppShell>
  );
}
