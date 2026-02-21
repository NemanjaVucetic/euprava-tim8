import { useEffect, useMemo, useState } from "react";
import { mupVehiclesApi, trafficPoliceApi } from "../api/queries";
import Select from "../components/Select";
import {
  type PolicePerson,
  type TypeOfViolation,
  type Violation,
  type Vehicle,
  type Driver,
  formatRank,
  formatViolation,
} from "../types/api";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

// backend može vratiti violation sam ili wrapper
type CreateViolationResponse =
  | Violation
  | {
    violation: Violation;
    vehicle?: any;
    driver?: any;
    warning?: string;
  };

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selected, setSelected] = useState<Violation | null>(null);

  const [police, setPolice] = useState<PolicePerson[]>([]);
  const [mupVehicles, setMupVehicles] = useState<Vehicle[]>([]);
  const [mupDrivers, setMupDrivers] = useState<Driver[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // filter
  const [driverFilter, setDriverFilter] = useState("");

  // create form
  const [typeOfViolation, setTypeOfViolation] = useState<TypeOfViolation>("MINOR");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState("");



  // NOTE: driverId = MUP driver UUID, vehicleId = registration string
  const [driverId, setDriverId] = useState("");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [policeId, setPoliceId] = useState("");

  const [creating, setCreating] = useState(false);

  const typeOptions = useMemo(
    () => [
      { value: "MINOR" as TypeOfViolation, label: "Mali" },
      { value: "MAJOR" as TypeOfViolation, label: "Veliki" },
      { value: "CRITICAL" as TypeOfViolation, label: "Kritican" },
    ],
    []
  );

  const policeOptions = useMemo(
    () =>
      police.map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName} • ${formatRank(p.rank)}${p.isSuspended ? " (SUSP)" : ""}`,
      })),
    [police]
  );

  // IMPORTANT: value = registration (ne id)
  const vehicleOptions = useMemo(
    () =>
      mupVehicles.map((v) => ({
        value: v.registration,
        label: `${v.registration} • ${v.mark} ${v.model} (${v.year})`,
      })),
    [mupVehicles]
  );

  const driverOptions = useMemo(
    () =>
      mupDrivers.map((d) => ({
        value: d.id,
        label: `${d.owner?.firstName ?? "-"} ${d.owner?.lastName ?? "-"} • points: ${d.numberOfViolationPoints
          }${d.isSuspended ? " (SUSP)" : ""}`,
      })),
    [mupDrivers]
  );

  async function loadBase() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const [vList, pList, vehList, drvList] = await Promise.all([
        trafficPoliceApi.getViolations(),
        trafficPoliceApi.getPolice(),
        mupVehiclesApi.getVehicles(),
        mupVehiclesApi.getDrivers(),
      ]);

      setViolations(Array.isArray(vList) ? (vList as Violation[]) : []);
      setPolice(Array.isArray(pList) ? (pList as PolicePerson[]) : []);
      setMupVehicles(Array.isArray(vehList) ? (vehList as Vehicle[]) : []);
      setMupDrivers(Array.isArray(drvList) ? (drvList as Driver[]) : []);
      setSelected(null);
    } catch (e: any) {
      setError(e?.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBase();
  }, []);

  async function openDetails(id: string) {
    setError(null);
    setSuccess(null);
    try {
      const v = (await trafficPoliceApi.getViolationById(id)) as Violation;
      setSelected(v || null);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam detalje.");
    }
  }

  async function searchByDriver() {
    const id = driverFilter.trim();
    if (!id) return loadBase();

    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const list = (await trafficPoliceApi.getViolationsByDriver(id)) as Violation[];
      setViolations(Array.isArray(list) ? list : []);
      setSelected(null);
    } catch (e: any) {
      setError(e?.message || "Ne mogu da pronađem prekršaje za driverId.");
    } finally {
      setLoading(false);
    }
  }

  async function createViolation() {
    setError(null);
    setSuccess(null);

    const payload = {
      typeOfViolation,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      location: location.trim(),

      // MUP driver UUID
      driverId: driverId.trim(),

      // registration string (backend tako očekuje)
      vehicleId: vehicleRegistration,

      // traffic police UUID
      policeId,
    };

    if (!payload.location) return setError("Lokacija je obavezna.");
    if (!payload.driverId) return setError("Vozač je obavezan.");
    if (!payload.vehicleId) return setError("Vozilo je obavezno.");
    if (!payload.policeId) return setError("Policajac je obavezan.");

    setCreating(true);
    try {
      const res = (await trafficPoliceApi.createViolation(payload)) as CreateViolationResponse;

      // normalize
      const created: Violation =
        (res as any)?.violation ? (res as any).violation : (res as Violation);

      const warning = (res as any)?.warning as string | undefined;

      setViolations((prev) => [created, ...prev]);
      setSelected(created);

      if (warning) setSuccess(`Kreirano, ali: ${warning}`);
      else setSuccess("Prekršaj kreiran. Poeni vozača su ažurirani.");

      // reset form
      setLocation("");
      setDriverId("");
      setVehicleRegistration("");
      setPoliceId("");
      setTypeOfViolation("MINOR");
      setDate(new Date().toISOString().slice(0, 16));

      // refresh drivers (da vidiš updated points/suspend u dropdown-u)
      const drvList = (await mupVehiclesApi.getDrivers()) as Driver[];
      setMupDrivers(Array.isArray(drvList) ? drvList : []);
    } catch (e: any) {
      setError(e?.message || "Neuspešno kreiranje prekršaja.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Prekršaji</h2>
            <p className="mt-1 text-sm text-slate-400">
              Detalji
            </p>
          </div>

          <button
            onClick={loadBase}
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

        {success && (
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {/* Filter */}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={searchByDriver}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Pretraži
          </button>
        </div>

        {/* List + Details */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <p className="text-sm font-semibold">Lista</p>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
              {violations.length === 0 && !loading ? (
                <div className="rounded-xl border border-slate-800 bg-white/5 p-3 text-sm text-slate-400">
                  Nema prekršaja.
                </div>
              ) : (
                violations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => openDetails(v.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selected?.id === v.id
                      ? "border-indigo-500/60 bg-indigo-500/10"
                      : "border-slate-800 bg-white/5 hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatViolation(v.typeOfViolation)}</span>
                      <span className="text-xs text-slate-500">{fmtDate(v.date)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{v.location}</div>
                    <div className="mt-1 text-xs text-slate-500 break-all">
                      Driver: {String(v.driverId)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 break-all">
                      Vehicle: {String(v.vehicleId)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <p className="text-sm font-semibold">Detalji</p>
            {!selected ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-white/5 p-3 text-sm text-slate-400">
                Izaberi prekršaj levo.
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">ID</p>
                  <p className="break-all font-mono text-xs text-slate-200">{selected.id}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Tip</p>
                    <p className="font-semibold">{selected.typeOfViolation}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Datum</p>
                    <p className="font-semibold">{fmtDate(selected.date)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Lokacija</p>
                  <p className="font-semibold">{selected.location}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Driver</p>
                    <p className="break-all font-mono text-xs text-slate-200">
                      {String(selected.driverId)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="break-all font-mono text-xs text-slate-200">
                      {String(selected.vehicleId)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Police</p>
                    <p className="break-all font-mono text-xs text-slate-200">
                      {String(selected.policeId)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Create */}
      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Kreiraj prekršaj</h3>

        <div className="mt-4 grid gap-3">
          <Select label="Tip" value={typeOfViolation} onChange={setTypeOfViolation} options={typeOptions} />

          <div>
            <label className="mb-1 block text-xs text-slate-400">Datum</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Lokacija</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="npr. Novi Sad"
            />
          </div>

          <Select
            label="Vozač (MUP)"
            value={driverId}
            onChange={setDriverId}
            options={driverOptions}
            placeholder={mupDrivers.length ? "-- izaberi vozača --" : "Nema vozača"}
            disabled={mupDrivers.length === 0}
          />

          <Select
            label="Vozilo (MUP) – registracija"
            value={vehicleRegistration}
            onChange={setVehicleRegistration}
            options={vehicleOptions}
            placeholder={mupVehicles.length ? "-- izaberi vozilo --" : "Nema vozila"}
            disabled={mupVehicles.length === 0}
          />

          <Select
            label="Policajac"
            value={policeId}
            onChange={setPoliceId}
            options={policeOptions}
            placeholder={police.length ? "-- izaberi policajca --" : "Nema policajaca"}
            disabled={police.length === 0}
          />

          <button
            onClick={createViolation}
            disabled={creating}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {creating ? "Kreiram..." : "Kreiraj"}
          </button>
        </div>
      </aside>
    </div>
  );
}
