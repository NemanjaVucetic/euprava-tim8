import { useEffect, useState } from "react";
import { mupVehiclesApi, trafficPoliceApi } from "../api/queries";
import type { Driver, Vehicle } from "../types/api";

interface DriverReport {
  driver_id: string;
  risk_level: string;
  risk_score: number;
  total_violations: number;
}

function formatRiskLevel(level: string): string {
  switch (level) {
    case "HIGH":
    case "DANGEROUS":
      return "Visok";
    case "MEDIUM":
    case "RISKY":
      return "Srednji";
    default:
      return "Nizak";
  }
}

export default function ChecksPage() {
  const [mupVehicles, setMupVehicles] = useState<Vehicle[]>([]);
  const [selectedReg, setSelectedReg] = useState("");
  const [inputJmbg, setInputJmbg] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null);

  const [mupDrivers, setMupDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [report, setReport] = useState<DriverReport | null>(null);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicleList, driverList] = await Promise.all([
          mupVehiclesApi.getVehicles(),
          mupVehiclesApi.getDrivers(),
        ]);
        setMupVehicles(vehicleList as Vehicle[]);
        setMupDrivers(driverList as Driver[]);
      } catch (e: any) {
        setError(e?.message || "Ne mogu da ucitam podatke za provere.");
      }
    }
    void loadData();
  }, []);

  const handleVerify = async () => {
    setLoadingVerify(true);
    setError(null);
    try {
      const result = await trafficPoliceApi.verifyVehicle({
        registration: selectedReg,
        jmbg: inputJmbg,
      });
      setVerifyResult(result as { valid: boolean; reason?: string });
    } catch (e: any) {
      setError(e?.message || "Neuspesna provera vlasnistva.");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleGetReport = async () => {
    if (!selectedDriverId) return;
    setLoadingReport(true);
    setError(null);
    try {
      const result = await trafficPoliceApi.getDriverReport(selectedDriverId);
      setReport(result as unknown as DriverReport);
    } catch (e: any) {
      setError(e?.message || "Neuspesno ucitavanje izvestaja.");
    } finally {
      setLoadingReport(false);
    }
  };

  const riskColor = (level: string) => {
    switch (level) {
      case "DANGEROUS":
      case "HIGH":
        return "text-orange-400";
      case "RISKY":
      case "MEDIUM":
        return "text-amber-400";
      default:
        return "text-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Provere</h1>
        <p className="text-sm text-slate-400">Provera vlasnistva vozila i procena rizika vozaca.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Provera vlasnistva</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Izaberi vozilo</label>
              <select
                value={selectedReg}
                onChange={(e) => setSelectedReg(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <option value="">-- odaberi registraciju --</option>
                {mupVehicles.map((vehicleItem) => (
                  <option key={vehicleItem.id} value={vehicleItem.registration}>
                    {vehicleItem.registration}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Unesi JMBG vlasnika</label>
              <input
                type="text"
                value={inputJmbg}
                onChange={(e) => setInputJmbg(e.target.value)}
                placeholder="Unesi 13 cifara"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loadingVerify || !selectedReg || !inputJmbg}
              className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-bold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingVerify ? "Proveravam..." : "Proveri validnost"}
            </button>

            {verifyResult && (
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  verifyResult.valid
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                <p className="text-sm font-bold">
                  {verifyResult.valid
                    ? "Validno: JMBG odgovara evidenciji MUP-a"
                    : "Nevalidno: JMBG ne odgovara vlasniku vozila"}
                </p>
                {verifyResult.reason && <p className="mt-1 text-xs text-slate-300">{verifyResult.reason}</p>}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Analiza rizika vozaca</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Izaberi vozaca</label>
              <select
                value={selectedDriverId}
                onChange={(e) => {
                  setSelectedDriverId(e.target.value);
                  setReport(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <option value="">-- odaberi vozaca --</option>
                {mupDrivers.map((driverItem) => (
                  <option key={driverItem.id} value={driverItem.id}>
                    {driverItem.owner.firstName} {driverItem.owner.lastName} ({driverItem.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGetReport}
              disabled={loadingReport || !selectedDriverId}
              className="w-full rounded-xl bg-amber-600 py-2 text-sm font-bold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingReport ? "Ucitavam..." : "Generisi izvestaj"}
            </button>

            {report && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Vozac ID:</span>
                  <span className="font-mono text-xs text-slate-300">{report.driver_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Ukupno prekrsaja:</span>
                  <span className="font-bold">{report.total_violations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Skor rizika:</span>
                  <span className="font-bold">{report.risk_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Nivo rizika:</span>
                  <span className={`text-sm font-bold ${riskColor(report.risk_level)}`}>
                    {formatRiskLevel(report.risk_level)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
