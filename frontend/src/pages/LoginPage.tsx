import { useState } from "react";
import { authApi } from "../api/queries";

type Props = {
  onLogin: (username: string) => void;
};

type Mode = "login" | "register";
type Role = "CITIZEN" | "MUP" | "TRAFFIC";

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>("login");

  const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState(""); // optional, ali korisno
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const usernameOk = firstName.trim().length >= 3;
  const passwordOk = password.trim().length >= 3;

  const canLogin = usernameOk && passwordOk;
  const canRegister = usernameOk && passwordOk && confirm === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (loading) return;

    try {
      setLoading(true);

      if (mode === "register") {
        if (!canRegister) return;

        await authApi.register({
          firstName,
          lastName,
          email: email || undefined,
          password,
          // ako backend podržava:
          // firstName, lastName ...
        });

        setSuccess("Registracija uspešna. Sada se prijavi.");
        setMode("login");
        setConfirm("");
        // ostavljamo username da bude popunjen
        return;
      }

      // LOGIN
      if (!canLogin) return;

      const res = await authApi.login({
        email,
        password,
      });

      const token = res?.accessToken || res?.token;
      if (token) localStorage.setItem("accessToken", token);

      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      onLogin(`${email} (${role})`);
    } catch (err: any) {
      setError(err?.message || "Neuspešna akcija");
    } finally {
      setLoading(false);
    }
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
            Prijava / registracija za pristup servisima:{" "}
            <span className="text-slate-200">MUP Vozila</span> i{" "}
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
            Tip: za demo možeš registrovati novog korisnika pa se odmah prijaviti.
          </div>
        </div>

        {/* Right / form */}
        <div className="rounded-3xl border border-slate-800 bg-white/5 p-6 shadow-xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-900/30 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-indigo-500 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-indigo-500 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              Registracija
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-semibold">
              {mode === "login" ? "Prijava" : "Registracija"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === "login"
                ? "Unesi kredencijale da pristupiš portalu."
                : "Kreiraj nalog za pristup portalu."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Korisničko ime
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="npr. dalibor"
              />
                            <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="npr. dalibor"
              />
              {!usernameOk && firstName.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 3 karaktera.
                </p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Email (opciono)
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="npr. dalibor@mail.com"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
              {!passwordOk && password.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 3 karaktera.
                </p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Potvrdi lozinku
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-1 text-xs text-red-300">
                    Lozinke se ne poklapaju.
                  </p>
                )}
              </div>
            )}

            {/* Role ostaje kao demo/select */}
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Uloga
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="CITIZEN">Građanin</option>
                <option value="MUP">Službenik MUP</option>
                <option value="TRAFFIC">Saobraćajna policija</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || (mode === "login" ? !canLogin : !canRegister)}
              className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Sačekaj..."
                : mode === "login"
                ? "Prijavi se"
                : "Registruj se"}
            </button>

            <p className="text-center text-xs text-slate-500">
              {mode === "login" ? (
                <>
                  Nemaš nalog?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-slate-200 underline underline-offset-4 hover:text-white"
                  >
                    Registruj se
                  </button>
                </>
              ) : (
                <>
                  Već imaš nalog?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-slate-200 underline underline-offset-4 hover:text-white"
                  >
                    Prijavi se
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
