import { useState } from "react";

type Props = {
  onLogin: (username: string) => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"citizen" | "mup" | "traffic">("citizen");

  const canSubmit = username.trim().length >= 3 && password.trim().length >= 3;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    // demo: samo “uloguj”
    onLogin(`${username} (${role})`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2">
        {/* Left / branding */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-white/5 px-4 py-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400" />
            <div>
              <p className="text-xs text-slate-400">FTN • Projekat</p>
              <p className="text-sm font-semibold">e-Uprava (mikroservisi)</p>
            </div>
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Portal za usluge građana i institucija
          </h1>

          <p className="text-slate-400">
            Prijava za pristup servisima: <span className="text-slate-200">MUP Vozila</span> i{" "}
            <span className="text-slate-200">Saobraćajna Policija</span>.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-white/5 p-4">
              <p className="text-sm font-medium">MUP Vozila</p>
              <p className="mt-1 text-sm text-slate-400">
                Registracija, provera vozila, vlasništvo, status.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-white/5 p-4">
              <p className="text-sm font-medium">Saobraćajna Policija</p>
              <p className="mt-1 text-sm text-slate-400">
                Kazne, prekršaji, status dozvole, evidencije.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 text-sm text-slate-300">
            Tip: za demo možeš koristiti bilo koji username/password (min 3 karaktera).
          </div>
        </div>

        {/* Right / form */}
        <div className="rounded-3xl border border-slate-800 bg-white/5 p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Prijava</h2>
            <p className="mt-1 text-sm text-slate-400">Unesi kredencijale da pristupiš portalu.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Korisničko ime</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="npr. dalibor"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Uloga (demo)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="citizen">Građanin</option>
                <option value="mup">Službenik MUP</option>
                <option value="traffic">Saobraćajna policija</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prijavi se
            </button>

            <p className="text-center text-xs text-slate-500">
              Ovo je demo UI — autentikaciju kasnije vežeš na auth servis / gateway.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
