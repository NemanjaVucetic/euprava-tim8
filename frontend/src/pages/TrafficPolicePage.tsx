import { useEffect, useMemo, useState } from "react";
import { trafficPoliceApi } from "../api/queries";
import type { PolicePerson, TypeOfViolation, Violation } from "../types/api";

function fmtDate(iso: string) {
  // backend ti šalje string; može biti ISO ili "2026-02-17"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isToday(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function TrafficPolicePage() {
  // ===== data =====
  const [violations, setViolations] = useState<Violation[]>([]);
  const [police, setPolice] = useState<PolicePerson[]>([]);

  // ===== ui state =====
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [loadingPolice, setLoadingPolice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== search =====
  const [driverId, setDriverId] = useState("");

  // ===== details =====
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ===== create violation form =====
  const [newType, setNewType] = useState<TypeOfViolation>("MINOR");
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0, 16)); // "YYYY-MM-DDTHH:mm"
  const [newLocation, setNewLocation] = useState("");
  const [newDriverId, setNewDriverId] = useState<string>("");
  const [newVehicleId, setNewVehicleId] = useState<string>("");
  const [newPoliceId, setNewPoliceId] = useState<string>("");

  const [creating, setCreating] = useState(false);

  // ===== load initial =====
  useEffect(() => {
    void loadAllViolations();
    void loadPolice();
  }, []);

  async function loadAllViolations() {
    setError(null);
    setLoadingViolations(true);
    try {
      const list = (await trafficPoliceApi.getViolations()) as Violation[];
      setViolations(Array.isArray(list) ? list : []);
      setSelectedViolation(null);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam prekršaje.");
    } finally {
      setLoadingViolations(false);
    }
  }

  async function loadPolice() {
    setError(null);
    setLoadingPolice(true);
    try {
      const list = (await trafficPoliceApi.getPolice()) as PolicePerson[];
      setPolice(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam policajce.");
    } finally {
      setLoadingPolice(false);
    }
  }

  async function searchByDriver() {
    setError(null);

    const id = driverId.trim();
    if (!id) {
      setError("Unesi driverId (UUID) za pretragu.");
      return;
    }

    setLoadingViolations(true);
    try {
      const list = (await trafficPoliceApi.getViolationsByDriver(id)) as Violation[];
      setViolations(Array.isArray(list) ? list : []);
      setSelectedViolation(null);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da pronađem prekršaje za unetog vozača.");
    } finally {
      setLoadingViolations(false);
    }
  }

  async function openDetails(id: string) {
    setError(null);
    setDetailsLoading(true);
    try {
      const v = (await trafficPoliceApi.getViolationById(id)) as Violation;
      setSelectedViolation(v || null);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam detalje prekršaja.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleSuspendPolice(id: string) {
    setError(null);
    try {
      await trafficPoliceApi.togglePoliceSuspend(id);
      // refresh list
      await loadPolice();
    } catch (e: any) {
      setError(e?.message || "Ne mogu da promenim status suspenzije policajca.");
    }
  }

  async function createViolation() {
    setError(null);

    const payload: Omit<Violation, "id"> = {
      typeOfViolation: newType,
      date: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
      location: newLocation.trim(),
      driverId: newDriverId.trim(),
      vehicleId: newVehicleId.trim(),
      policeId: newPoliceId.trim(),
    };

    if (!payload.location) return setError("Lokacija je obavezna.");
    if (!payload.driverId) return setError("driverId je obavezan.");
    if (!payload.vehicleId) return setError("vehicleId je obavezan.");
    if (!payload.policeId) return setError("policeId je obavezan.");

    setCreating(true);
    try {
      const created = (await trafficPoliceApi.createViolation(payload)) as Violation;

      // optimistički ubaci u listu
      setViolations((prev) => [created, ...prev]);
      setSelectedViolation(created);

      // reset forme (ostavi policeId ako želiš)
      setNewLocation("");
      setNewDriverId("");
      setNewVehicleId("");
      setNewType("MINOR");
      setNewDate(new Date().toISOString().slice(0, 16));
    } catch (e: any) {
      setError(e?.message || "Neuspešno kreiranje prekršaja.");
    } finally {
      setCreating(false);
    }
  }

  const stats = useMemo(() => {
    const total = violations.length;
    const today = violations.filter((v) => isToday(v.date)).length;
    const byType = violations.reduce(
      (acc, v) => {
        acc[v.typeOfViolation] = (acc[v.typeOfViolation] || 0) + 1;
        return acc;
      },
      {} as Record<TypeOfViolation, number>
    );

    return {
      total,
      today,
      minor: byType.MINOR || 0,
      major: byType.MAJOR || 0,
      critical: byType.CRITICAL || 0,
    };
  }, [violations]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT */}
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Prekršaji / kazne</h2>
            <p className="mt-1 text-sm text-slate-400">
              Pretraga radi preko <span className="text-slate-200">driverId</span> (endpoint:{" "}
              <span className="text-slate-300">/violations/driver/:driverId</span>)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadAllViolations}
              className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Svi prekršaji
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Driver ID (UUID)"
          />
          <button
            onClick={searchByDriver}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50"
            disabled={loadingViolations}
          >
            {loadingViolations ? "Učitavam..." : "Pretraži"}
          </button>
          <button
            onClick={() => {
              setDriverId("");
              void loadAllViolations();
            }}
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Reset
          </button>
        </div>

        {/* List + details */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Lista prekršaja</p>
              <p className="text-xs text-slate-500">
                {loadingViolations ? "Učitavam..." : `${violations.length} stavki`}
              </p>
            </div>

            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
              {violations.length === 0 && !loadingViolations ? (
                <div className="rounded-xl border border-slate-800 bg-white/5 p-3 text-sm text-slate-400">
                  Nema prekršaja za prikaz.
                </div>
              ) : (
                violations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => openDetails(v.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedViolation?.id === v.id
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-slate-800 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{v.typeOfViolation}</span>
                      <span className="text-xs text-slate-500">{fmtDate(v.date)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      <span className="text-slate-500">Lokacija:</span> {v.location || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      <span className="text-slate-500">Driver:</span> {String(v.driverId)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Detalji</p>
              {detailsLoading && <p className="text-xs text-slate-500">Učitavam...</p>}
            </div>

            {!selectedViolation ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-white/5 p-3 text-sm text-slate-400">
                Klikni na prekršaj levo da vidiš detalje.
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">ID</p>
                  <p className="font-mono text-xs text-slate-200">{selectedViolation.id}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Tip</p>
                    <p className="font-semibold">{selectedViolation.typeOfViolation}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Datum</p>
                    <p className="font-semibold">{fmtDate(selectedViolation.date)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Lokacija</p>
                  <p className="font-semibold">{selectedViolation.location || "—"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Driver ID</p>
                    <p className="break-all text-xs text-slate-200">{String(selectedViolation.driverId)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Vehicle ID</p>
                    <p className="break-all text-xs text-slate-200">{String(selectedViolation.vehicleId)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Police ID</p>
                    <p className="break-all text-xs text-slate-200">{String(selectedViolation.policeId)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create violation */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Kreiraj novi prekršaj</p>
              <p className="text-xs text-slate-400">POST /api/traffic-police/violations</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Tip prekršaja</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as TypeOfViolation)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="MINOR">MINOR</option>
                <option value="MAJOR">MAJOR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Datum</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Lokacija</label>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="npr. Novi Sad, Bulevar oslobođenja"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Driver ID</label>
              <input
                value={newDriverId}
                onChange={(e) => setNewDriverId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="UUID"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Vehicle ID</label>
              <input
                value={newVehicleId}
                onChange={(e) => setNewVehicleId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="UUID"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Police ID</label>
              <select
                value={newPoliceId}
                onChange={(e) => setNewPoliceId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- izaberi policajca --</option>
                {police.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} • {p.rank} {p.isSuspended ? "(SUSP)" : ""}
                  </option>
                ))}
              </select>
              {police.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Nema policajaca u bazi. Kreiraj policajca preko API-ja (POST /police) ili seeduj DB.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={createViolation}
              disabled={creating}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Kreiram..." : "Kreiraj prekršaj"}
            </button>

            <button
              onClick={() => {
                setNewLocation("");
                setNewDriverId("");
                setNewVehicleId("");
                setNewType("MINOR");
                setNewDate(new Date().toISOString().slice(0, 16));
              }}
              className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Očisti formu
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Pregled</h3>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400">Ukupno prekršaja</p>
            <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400">Danas</p>
            <p className="mt-1 text-2xl font-semibold">{stats.today}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400">Po tipu</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-white/5 p-2">
                <p className="text-slate-400">MINOR</p>
                <p className="text-lg font-semibold">{stats.minor}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-white/5 p-2">
                <p className="text-slate-400">MAJOR</p>
                <p className="text-lg font-semibold">{stats.major}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-white/5 p-2">
                <p className="text-slate-400">CRITICAL</p>
                <p className="text-lg font-semibold">{stats.critical}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 text-sm text-slate-300">
          Savet: za demo najlakše je prvo napraviti policajca i vozilo/driver u bazi, pa onda kreirati prekršaj.
        </div>

        {/* Police panel */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Policija</p>
            <button
              onClick={loadPolice}
              className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              {loadingPolice ? "..." : "Refresh"}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {police.length === 0 ? (
              <p className="text-sm text-slate-400">Nema policajaca u bazi.</p>
            ) : (
              police.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-800 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.rank} • {p.email}
                      </p>
                      <p className="mt-1 text-xs">
                        Status:{" "}
                        <span className={p.isSuspended ? "text-red-300" : "text-emerald-300"}>
                          {p.isSuspended ? "SUSPENDOVAN" : "AKTIVAN"}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => toggleSuspendPolice(p.id)}
                      className="rounded-xl border border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                    >
                      Toggle
                    </button>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500 font-mono break-all">
                    {p.id}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
