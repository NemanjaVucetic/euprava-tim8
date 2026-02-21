import { useEffect, useMemo, useState } from "react";
import { mupVehiclesApi } from "../api/queries";
import Select from "../components/Select";
import type { Administrator, Driver, Owner, OwnershipTransfer, Vehicle } from "../types/api";

type Section = "vehicles" | "drivers" | "owners" | "transfers" | "admins";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <div className="break-all font-mono text-[11px] text-slate-500">{children}</div>;
}

export default function MupVehiclesPage() {
  const [active, setActive] = useState<Section>("vehicles");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setHealth] = useState<any>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [, setAdmins] = useState<Administrator[]>([]);

  // details panels (selected)
  const [selectedReg, setSelectedReg] = useState<string>("");
  const [selectedJmbg, setSelectedJmbg] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const [vehicleByReg, setVehicleByReg] = useState<Vehicle | null>(null);
  const [vehicleByJmbg, setVehicleByJmbg] = useState<Vehicle | null>(null);
  const [driverById, setDriverById] = useState<Driver | null>(null);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: v.registration,
        label: `${v.registration} • ${v.mark} ${v.model} (${v.year})`,
      })),
    [vehicles]
  );

  const ownerOptions = useMemo(
    () =>
      owners.map((o) => ({
        value: o.jmbg,
        label: `${o.jmbg} • ${o.firstName} ${o.lastName}`,
      })),
    [owners]
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        value: d.id,
        label: `${d.owner?.firstName ?? "-"} ${d.owner?.lastName ?? "-"} • points: ${
          d.numberOfViolationPoints
        }${d.isSuspended ? " (SUSP)" : ""}`,
      })),
    [drivers]
  );

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [h, v, d, o, t, a] = await Promise.all([
        mupVehiclesApi.health(),
        mupVehiclesApi.getVehicles(),
        mupVehiclesApi.getDrivers(),
        mupVehiclesApi.getOwners(),
        mupVehiclesApi.getTransfers(),
        mupVehiclesApi.getAdmins(),
      ]);

      setHealth(h);
      setVehicles(Array.isArray(v) ? (v as Vehicle[]) : []);
      setDrivers(Array.isArray(d) ? (d as Driver[]) : []);
      setOwners(Array.isArray(o) ? (o as Owner[]) : []);
      setTransfers(Array.isArray(t) ? (t as OwnershipTransfer[]) : []);
      setAdmins(Array.isArray(a) ? (a as Administrator[]) : []);

      // reset details
      setVehicleByReg(null);
      setVehicleByJmbg(null);
      setDriverById(null);
      setSelectedReg("");
      setSelectedJmbg("");
      setSelectedDriverId("");
    } catch (e: any) {
      setError(e?.message || "Ne mogu da učitam MUP mock podatke.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function fetchVehicleByReg(reg: string) {
    setError(null);
    setVehicleByReg(null);
    if (!reg) return;
    try {
      const v = (await mupVehiclesApi.getVehicleByRegistration(reg)) as Vehicle;
      setVehicleByReg(v || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozila za ovu registraciju.");
    }
  }

  async function fetchVehicleByJmbg(jmbg: string) {
    setError(null);
    setVehicleByJmbg(null);
    if (!jmbg) return;
    try {
      const v = (await mupVehiclesApi.getVehicleByOwnerJmbg(jmbg)) as Vehicle;
      setVehicleByJmbg(v || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozila za ovaj JMBG.");
    }
  }

  async function fetchDriverById(id: string) {
    setError(null);
    setDriverById(null);
    if (!id) return;
    try {
      const d = (await mupVehiclesApi.getDriverById(id)) as Driver;
      setDriverById(d || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozača za ovaj ID.");
    }
  }

  return (
    <div className="grid gap-6">
      {/* header */}
      <div className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">MUP Vozila</h1>
            <p className="mt-1 text-sm text-slate-400">
              Pregled podataka
            </p>
          </div>

          <button
            onClick={loadAll}
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
      </div>

      {/* navigation */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["vehicles", "Vozila"],
            ["drivers", "Vozači"],
            ["owners", "Vlasnici"],
            ["transfers", "Prenosi"],
          ] as Array<[Section, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active === key
                ? "bg-indigo-500 text-white"
                : "border border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {active === "vehicles" && (
          <>
            <div className="lg:col-span-2 grid gap-6">
              <Card title={`Lista vozila (${vehicles.length})`}>
                <div className="grid gap-3">
                  {vehicles.map((v) => (
                    <div key={v.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                      <p className="text-sm font-semibold">
                        {v.registration} • {v.mark} {v.model} ({v.year})
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Boja: {v.color} • Ukradeno: {String(v.isStolen)}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        Vlasnik: {v.owner?.firstName} {v.owner?.lastName} • {v.owner?.jmbg}
                      </p>
                      <Mono>ID: {v.id}</Mono>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card title="Pretraga po registraciji">
                <Select
                  label="Registracija"
                  value={selectedReg}
                  onChange={(v) => {
                    setSelectedReg(v);
                    void fetchVehicleByReg(v);
                  }}
                  options={vehicleOptions}
                  placeholder={vehicles.length ? "-- izaberi vozilo --" : "Nema vozila"}
                  disabled={vehicles.length === 0}
                />

                {vehicleByReg && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {vehicleByReg.registration} • {vehicleByReg.mark} {vehicleByReg.model}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {vehicleByReg.color} • {vehicleByReg.year} • stolen: {String(vehicleByReg.isStolen)}
                    </p>
                    <p className="mt-2 text-xs text-slate-300">
                      Owner: {vehicleByReg.owner?.firstName} {vehicleByReg.owner?.lastName} •{" "}
                      {vehicleByReg.owner?.jmbg}
                    </p>
                    <Mono>{vehicleByReg.id}</Mono>
                  </div>
                )}
              </Card>

              <Card title="Vozilo po JMBG vlasnika">
                <Select
                  label="JMBG"
                  value={selectedJmbg}
                  onChange={(v) => {
                    setSelectedJmbg(v);
                    void fetchVehicleByJmbg(v);
                  }}
                  options={ownerOptions}
                  placeholder={owners.length ? "-- izaberi vlasnika --" : "Nema vlasnika"}
                  disabled={owners.length === 0}
                />

                {vehicleByJmbg && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {vehicleByJmbg.registration} • {vehicleByJmbg.mark} {vehicleByJmbg.model}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Owner JMBG: {vehicleByJmbg.owner?.jmbg}
                    </p>
                    <Mono>{vehicleByJmbg.id}</Mono>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {active === "drivers" && (
          <>
            <div className="lg:col-span-2 grid gap-6">
              <Card title={`Lista vozača (${drivers.length})`}>
                <div className="grid gap-3">
                  {drivers.map((d) => (
                    <div key={d.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                      <p className="text-sm font-semibold">
                        {d.owner?.firstName} {d.owner?.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        points: {d.numberOfViolationPoints} • suspended: {String(d.isSuspended)}
                      </p>
                      <Mono>{d.id}</Mono>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card title="Vozac">
                <Select
                  label="Vozač"
                  value={selectedDriverId}
                  onChange={(v) => {
                    setSelectedDriverId(v);
                    void fetchDriverById(v);
                  }}
                  options={driverOptions}
                  placeholder={drivers.length ? "-- izaberi vozača --" : "Nema vozača"}
                  disabled={drivers.length === 0}
                />

                {driverById && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {driverById.owner?.firstName} {driverById.owner?.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      points: {driverById.numberOfViolationPoints} • suspended:{" "}
                      {String(driverById.isSuspended)}
                    </p>
                    <Mono>{driverById.id}</Mono>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {active === "owners" && (
          <div className="lg:col-span-3">
            <Card title={`Lista vlasnika (${owners.length})`}>
              <div className="grid gap-3 sm:grid-cols-2">
                {owners.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {o.firstName} {o.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{o.address}</p>
                    <p className="mt-1 text-xs text-slate-300">JMBG: {o.jmbg}</p>
                    <p className="mt-1 text-xs text-slate-300">Email: {o.email}</p>
                    <Mono>{o.id}</Mono>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {active === "transfers" && (
          <div className="lg:col-span-3">
            <Card title={`Prenosi vlasništva (${transfers.length})`}>
              {transfers.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                  Nema transfera (seed trenutno ne puni).
                </div>
              ) : (
                <div className="grid gap-3">
                  {transfers.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                      <p className="text-sm font-semibold">{t.vehicle?.registration}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        Old: {t.ownerOld?.firstName} {t.ownerOld?.lastName} → New:{" "}
                        {t.ownerNew?.firstName} {t.ownerNew?.lastName}
                      </p>
                      <Mono>{t.id}</Mono>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
