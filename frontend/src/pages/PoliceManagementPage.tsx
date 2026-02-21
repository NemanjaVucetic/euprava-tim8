import { useEffect, useMemo, useState } from "react";
import { trafficPoliceApi } from "../api/queries";
import Select from "../components/Select";
import type { PolicePerson, Rank, CreatePoliceRequest } from "../types/api";

export default function PoliceManagementPage() {
  const [police, setPolice] = useState<PolicePerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [rank, setRank]             = useState<Rank>("LOW");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");

  const rankOptions = useMemo(
    () => [
      { value: "LOW"    as Rank, label: "LOW"    },
      { value: "MEDIUM" as Rank, label: "MEDIUM" },
      { value: "HIGH"   as Rank, label: "HIGH"   },
    ],
    []
  );

  async function loadPolice() {
    setError(null);
    setLoading(true);
    try {
      const list = (await trafficPoliceApi.getPolice()) as PolicePerson[];
      setPolice(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam policajce.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPolice(); }, []);

  async function toggleSuspend(id: string) {
    setError(null);
    try {
      await trafficPoliceApi.togglePoliceSuspend(id);
      await loadPolice();
    } catch (e: any) {
      setError(e?.message || "Ne mogu da promenim status.");
    }
  }

  async function changeRank(id: string, direction: "upgrade" | "downgrade") {
    setError(null);
    try {
      if (direction === "upgrade") await trafficPoliceApi.upgradePoliceRank(id);
      else                         await trafficPoliceApi.downgradePoliceRank(id);
      await loadPolice();
    } catch (e: any) {
      setError(e?.message || "Ne mogu da promenim rank.");
    }
  }

  async function createPolice() {
    setError(null);

    if (firstName.trim().length < 2) return setError("Ime je obavezno (min 2).");
    if (lastName.trim().length < 2)  return setError("Prezime je obavezno (min 2).");
    if (!email.includes("@"))        return setError("Email nije validan.");
    if (password.trim().length < 3)  return setError("Lozinka min 3.");

    const payload: CreatePoliceRequest = {
      firstName:   firstName.trim(),
      lastName:    lastName.trim(),
      rank,
      email:       email.trim(),
      password,
      isSuspended: false,
    };

    try {
      await trafficPoliceApi.createPolice(payload);
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setRank("LOW");
      await loadPolice();
    } catch (e: any) {
      setError(e?.message || "Neuspešno kreiranje policajca.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Policija</h2>
          <button
            onClick={loadPolice}
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          {police.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
              Nema policajaca u bazi.
            </div>
          ) : (
            police.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {p.policeProfile.firstName} {p.policeProfile.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.policeProfile.rank} • {p.email}
                    </p>
                    <p className="mt-1 text-xs">
                      Status:{" "}
                      <span className={p.policeProfile.isSuspended ? "text-red-300" : "text-emerald-300"}>
                        {p.policeProfile.isSuspended ? "SUSPENDOVAN" : "AKTIVAN"}
                      </span>
                    </p>
                    <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{p.id}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleSuspend(p.id)}
                      className="rounded-xl border border-slate-700 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Toggle suspend
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => changeRank(p.id, "upgrade")}
                        disabled={p.policeProfile.rank === "HIGH"}
                        className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▲ Rank
                      </button>
                      <button
                        onClick={() => changeRank(p.id, "downgrade")}
                        disabled={p.policeProfile.rank === "LOW"}
                        className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▼ Rank
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Dodaj policajca</h3>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Ime</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Prezime</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <Select label="Rank" value={rank} onChange={setRank} options={rankOptions} />

          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Lozinka</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <button onClick={createPolice}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Kreiraj
          </button>
        </div>
      </aside>
    </div>
  );
}