import { useState } from "react";
import { authApi, type LoginResponse } from "../api/queries";

type Props = {
  onLogin: (email: string, role: "CITIZEN" | "MUP" | "TRAFFIC") => void;
};

type Mode = "login" | "register";

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const firstNameOk = firstName.trim().length >= 2;
  const lastNameOk = lastName.trim().length >= 2;
  const emailOk = email.trim().length >= 5 && email.includes("@");
  const passwordOk = password.trim().length >= 3;

  const canLogin = emailOk && passwordOk;
  const canRegister = firstNameOk && lastNameOk && emailOk && passwordOk && confirm === password;

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (loading) return;

    try {
      setLoading(true);

      if (mode === "register") {
        if (!canRegister) return;

        await authApi.register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        });

        setSuccess("Registracija je uspesna. Nastavite prijavom.");
        setMode("login");
        setConfirm("");
        setPassword("");
        return;
      }

      if (!canLogin) return;

      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      const token =
        (res as LoginResponse)?.accessToken ||
        (res as LoginResponse)?.access_token ||
        (res as LoginResponse)?.token;
      if (token) localStorage.setItem("accessToken", token);

      localStorage.setItem("email", email.trim());
      const role = ((res as LoginResponse)?.role || "").trim().toUpperCase();
      if (role === "CITIZEN" || role === "MUP" || role === "TRAFFIC") {
        localStorage.setItem("role", role);
      } else {
        localStorage.removeItem("role");
        throw new Error("Login response nema validnu rolu.");
      }

      onLogin(email.trim(), role as "CITIZEN" | "MUP" | "TRAFFIC");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Prijava nije uspela. Proverite unete podatke i pokusajte ponovo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-white/5 px-4 py-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400" />
            <div>
              <p className="text-xs text-slate-400">e-Uprava</p>
              <p className="text-sm font-semibold">Portal</p>
            </div>
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Portal za usluge gradjana i institucija
          </h1>

          <p className="text-slate-400">
            Prijava i registracija za pristup servisima za evidenciju vozila, prekrsaja i policijskih
            provera.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-white/5 p-4">
              <p className="text-sm font-medium">MUP evidencija</p>
              <p className="mt-1 text-sm text-slate-400">Pregled vozila, vlasnika i vozaca.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-white/5 p-4">
              <p className="text-sm font-medium">Saobracajna policija</p>
              <p className="mt-1 text-sm text-slate-400">Evidencija i obrada prekrsaja.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-white/5 p-6 shadow-xl">
          <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-900/30 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessages();
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "login" ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                resetMessages();
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "register" ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              Registracija
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-semibold">{mode === "login" ? "Prijava" : "Registracija"}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === "login"
                ? "Unesite email i lozinku za pristup."
                : "Unesite osnovne podatke za kreiranje naloga."}
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
            {mode === "register" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Ime</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    placeholder="Unesite ime"
                    autoComplete="given-name"
                  />
                  {!firstNameOk && firstName.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">Minimum 2 karaktera.</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm text-slate-300">Prezime</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    placeholder="Unesite prezime"
                    autoComplete="family-name"
                  />
                  {!lastNameOk && lastName.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">Minimum 2 karaktera.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Unesite email"
                type="email"
                autoComplete="email"
              />
              {!emailOk && email.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">Unesite ispravan email.</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Unesite lozinku"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {!passwordOk && password.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">Minimum 3 karaktera.</p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Potvrdite lozinku</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="Ponovo unesite lozinku"
                  autoComplete="new-password"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-1 text-xs text-red-300">Lozinke se ne poklapaju.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "login" ? !canLogin : !canRegister)}
              className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sacekajte..." : mode === "login" ? "Prijavi se" : "Registruj se"}
            </button>

            <p className="text-center text-xs text-slate-500">
              {mode === "login" ? (
                <>
                  Nemate nalog?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      resetMessages();
                    }}
                    className="text-slate-200 underline underline-offset-4 hover:text-white"
                  >
                    Registrujte se
                  </button>
                </>
              ) : (
                <>
                  Vec imate nalog?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      resetMessages();
                    }}
                    className="text-slate-200 underline underline-offset-4 hover:text-white"
                  >
                    Prijavite se
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
