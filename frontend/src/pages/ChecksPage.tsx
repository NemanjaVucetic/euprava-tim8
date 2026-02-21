import { useEffect, useState } from "react";
import { mupVehiclesApi, trafficPoliceApi } from "../api/queries";
import type { Driver, Vehicle } from "../types/api";

interface DriverReport {
  driver_id: string;
  risk_level: string;
  risk_score: number;
  total_violations: number;
}

export default function ChecksPage() {
  // Vehicle Verify States
  const [mupVehicles, setMupVehicles] = useState<Vehicle[]>([]);
  const [selectedReg, setSelectedReg] = useState("");
  const [inputJmbg, setInputJmbg] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null);

  // Driver Report States
  const [mupDrivers, setMupDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [report, setReport] = useState<DriverReport | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [vList, dList] = await Promise.all([
        mupVehiclesApi.getVehicles(),
        mupVehiclesApi.getDrivers(),
      ]);
      setMupVehicles(vList as Vehicle[]);
      setMupDrivers(dList as Driver[]);
    }
    loadData();
  }, []);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await trafficPoliceApi.verifyVehicle({
        registration: selectedReg,
        jmbg: inputJmbg,
      });
      setVerifyResult(res as { valid: boolean; reason?: string });
    } catch (e) {
      alert("Error verifying vehicle");
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!selectedDriverId) return;
    setLoading(true);
    try {
      const res = await trafficPoliceApi.getDriverReport(selectedDriverId);
      setReport(res as unknown as DriverReport);
    } catch (e) {
      alert("Error fetching driver report");
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level: string) => {
    switch (level) {
      case "DANGEROUS": return "text-red-400";
      case "RISKY":
      case "HIGH":     return "text-orange-400";
      case "MEDIUM":   return "text-amber-400";
      default:         return "text-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Provere</h1>
        <p className="text-slate-400 text-sm">Provera Vlasništva i analiza rizika vozaca.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECTION 1: VEHICLE VERIFICATION */}
        <section className="rounded-2xl border border-slate-800 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Provera Vlasništva</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Izaberi Vozilo</label>
              <select
                value={selectedReg}
                onChange={(e) => setSelectedReg(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <option value="">-- Odaberi registraciju --</option>
                {mupVehicles.map(v => (
                  <option key={v.id} value={v.registration}>{v.registration}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Unesi JMBG vlasnika</label>
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
              disabled={loading || !selectedReg || !inputJmbg}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-xl text-sm font-bold transition"
            >
              {loading ? "Proveravam..." : "Proveri Validnost"}
            </button>

            {verifyResult && (
              <div className={`mt-4 p-4 rounded-xl border ${verifyResult.valid ? "bg-emerald-500/10 border-emerald-500/50" : "bg-red-500/10 border-red-500/50"}`}>
                <p className="text-sm font-bold">
                  {verifyResult.valid
                    ? "✅ VALIDNO: JMBG odgovara bazi MUP-a"
                    : "❌ NEVALIDNO: JMBG ne odgovara vlasniku vozila"}
                </p>
                {verifyResult.reason && (
                  <p className="text-xs text-slate-400 mt-1">{verifyResult.reason}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: DRIVER RISK REPORT */}
        <section className="rounded-2xl border border-slate-800 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Analiza Rizika Vozača</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Izaberi Vozača</label>
              <select
                value={selectedDriverId}
                onChange={(e) => { setSelectedDriverId(e.target.value); setReport(null); }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <option value="">-- Odaberi vozača --</option>
                {mupDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.owner.firstName} {d.owner.lastName} ({d.id})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGetReport}
              disabled={loading || !selectedDriverId}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-xl text-sm font-bold transition"
            >
              {loading ? "Učitavam..." : "Generiši Izveštaj"}
            </button>

            {report && (
              <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Driver ID:</span>
                  <span className="font-mono text-xs text-slate-300">{report.driver_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Ukupno prekršaja:</span>
                  <span className="font-bold">{report.total_violations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Risk Score:</span>
                  <span className="font-bold">{report.risk_score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Nivo Rizika:</span>
                  <span className={`font-bold text-sm ${riskColor(report.risk_level)}`}>
                    {report.risk_level}
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
