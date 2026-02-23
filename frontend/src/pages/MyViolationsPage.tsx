import { useEffect, useState } from "react";
import { trafficPoliceApi } from "../api/queries";
import { formatViolation, type Violation } from "../types/api";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function MyViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [driverId, setDriverId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMyViolations() {
    const email = (localStorage.getItem("email") || "").trim();
    if (!email) {
      setError("Nema ulogovanog korisnika.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await trafficPoliceApi.getMyViolations(email);
      setDriverId(res.driverId || "");
      setViolations(Array.isArray(res.violations) ? (res.violations as Violation[]) : []);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da ucitam tvoje prekrsaje.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyViolations();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Moji prekrsaji</h1>
            <p className="mt-1 text-sm text-slate-400">
              Pregled svih prekrsaja vezanih za tvoj vozacki profil.
            </p>
            {driverId && (
              <p className="mt-2 text-xs text-slate-500">
                Driver ID: <span className="font-mono">{driverId}</span>
              </p>
            )}
          </div>
          <button
            onClick={loadMyViolations}
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 text-sm text-slate-400">
          Ucitavanje...
        </div>
      ) : violations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 text-sm text-slate-400">
          Nemas evidentiranih prekrsaja.
        </div>
      ) : (
        <div className="grid gap-3">
          {violations.map((v) => (
            <div key={v.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{formatViolation(v.typeOfViolation)}</p>
                <p className="text-xs text-slate-500">{fmtDate(v.date)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">{v.location || "Nepoznata lokacija"}</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                <p>
                  Violation: <span className="font-mono text-slate-300">{v.id}</span>
                </p>
                <p>
                  Vehicle: <span className="font-mono text-slate-300">{String(v.vehicleId)}</span>
                </p>
                <p>
                  Police: <span className="font-mono text-slate-300">{String(v.policeId)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
