type Props = {
  user: string;
  active: "mup" | "traffic";
  onNavigate: (tab: "mup" | "traffic") => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export default function AppShell({ user, active, onNavigate, onLogout, children }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-slate-800 md:min-h-screen md:border-b-0 md:border-r">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">e-Uprava</p>
                <p className="text-sm font-semibold">Portal</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Ulogovan korisnik</p>
              <p className="mt-1 text-sm font-medium">{user}</p>
            </div>

            <nav className="mt-6 space-y-2">
              <button
                onClick={() => onNavigate("mup")}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium",
                  active === "mup"
                    ? "border-indigo-500 bg-indigo-500/15"
                    : "border-slate-800 bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                MUP Vozila
                <p className="mt-1 text-xs font-normal text-slate-400">Registracija • Provera</p>
              </button>

              <button
                onClick={() => onNavigate("traffic")}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium",
                  active === "traffic"
                    ? "border-indigo-500 bg-indigo-500/15"
                    : "border-slate-800 bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                Saobraćajna policija
                <p className="mt-1 text-xs font-normal text-slate-400">Kazne • Prekršaji</p>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div>
          <header className="border-b border-slate-800">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h1 className="text-lg font-semibold">
                  {active === "mup" ? "MUP Vozila" : "Saobraćajna policija"}
                </h1>
                <p className="text-sm text-slate-400">Demo dashboard UI</p>
              </div>

              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Odjava
              </button>
            </div>
          </header>

          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
