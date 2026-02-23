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

  const [selectedReg, setSelectedReg] = useState<string>("");
  const [selectedJmbg, setSelectedJmbg] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const [vehicleByReg, setVehicleByReg] = useState<Vehicle | null>(null);
  const [vehicleByJmbg, setVehicleByJmbg] = useState<Vehicle | null>(null);
  const [driverById, setDriverById] = useState<Driver | null>(null);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicleItem) => ({
        value: vehicleItem.registration,
        label: `${vehicleItem.registration} - ${vehicleItem.mark} ${vehicleItem.model} (${vehicleItem.year})`,
      })),
    [vehicles]
  );

  const ownerOptions = useMemo(
    () =>
      owners.map((ownerItem) => ({
        value: ownerItem.jmbg,
        label: `${ownerItem.jmbg} - ${ownerItem.firstName} ${ownerItem.lastName}`,
      })),
    [owners]
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((driverItem) => ({
        value: driverItem.id,
        label: `${driverItem.owner?.firstName ?? "-"} ${driverItem.owner?.lastName ?? "-"} - poeni: ${
          driverItem.numberOfViolationPoints
        }${driverItem.isSuspended ? " (SUSPENDOVAN)" : ""}`,
      })),
    [drivers]
  );

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [healthResult, vehicleList, driverList, ownerList, transferList, adminList] =
        await Promise.all([
          mupVehiclesApi.health(),
          mupVehiclesApi.getVehicles(),
          mupVehiclesApi.getDrivers(),
          mupVehiclesApi.getOwners(),
          mupVehiclesApi.getTransfers(),
          mupVehiclesApi.getAdmins(),
        ]);

      setHealth(healthResult);
      setVehicles(Array.isArray(vehicleList) ? (vehicleList as Vehicle[]) : []);
      setDrivers(Array.isArray(driverList) ? (driverList as Driver[]) : []);
      setOwners(Array.isArray(ownerList) ? (ownerList as Owner[]) : []);
      setTransfers(Array.isArray(transferList) ? (transferList as OwnershipTransfer[]) : []);
      setAdmins(Array.isArray(adminList) ? (adminList as Administrator[]) : []);

      setVehicleByReg(null);
      setVehicleByJmbg(null);
      setDriverById(null);
      setSelectedReg("");
      setSelectedJmbg("");
      setSelectedDriverId("");
    } catch (e: any) {
      setError(e?.message || "Ne mogu da ucitam MUP podatke.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function fetchVehicleByReg(registration: string) {
    setError(null);
    setVehicleByReg(null);
    if (!registration) return;
    try {
      const vehicleItem = (await mupVehiclesApi.getVehicleByRegistration(registration)) as Vehicle;
      setVehicleByReg(vehicleItem || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozila za izabranu registraciju.");
    }
  }

  async function fetchVehicleByJmbg(jmbg: string) {
    setError(null);
    setVehicleByJmbg(null);
    if (!jmbg) return;
    try {
      const vehicleItem = (await mupVehiclesApi.getVehicleByOwnerJmbg(jmbg)) as Vehicle;
      setVehicleByJmbg(vehicleItem || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozila za izabrani JMBG.");
    }
  }

  async function fetchDriverById(driverId: string) {
    setError(null);
    setDriverById(null);
    if (!driverId) return;
    try {
      const driverItem = (await mupVehiclesApi.getDriverById(driverId)) as Driver;
      setDriverById(driverItem || null);
    } catch (e: any) {
      setError(e?.message || "Nema vozaca za izabrani ID.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">MUP vozila</h1>
            <p className="mt-1 text-sm text-slate-400">Pregled vozila, vozaca i vlasnika.</p>
          </div>

          <button
            onClick={loadAll}
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            {loading ? "..." : "Osvezi"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["vehicles", "Vozila"],
            ["drivers", "Vozaci"],
            ["owners", "Vlasnici"],
            ["transfers", "Prenosi vlasnistva"],
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

      <div className="grid gap-6 lg:grid-cols-3">
        {active === "vehicles" && (
          <>
            <div className="grid gap-6 lg:col-span-2">
              <Card title={`Lista vozila (${vehicles.length})`}>
                <div className="grid gap-3">
                  {vehicles.map((vehicleItem) => (
                    <div
                      key={vehicleItem.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                    >
                      <p className="text-sm font-semibold">
                        {vehicleItem.registration} - {vehicleItem.mark} {vehicleItem.model} ({vehicleItem.year})
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Boja: {vehicleItem.color} - Ukradeno: {String(vehicleItem.isStolen)}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        Vlasnik: {vehicleItem.owner?.firstName} {vehicleItem.owner?.lastName} -{" "}
                        {vehicleItem.owner?.jmbg}
                      </p>
                      <Mono>ID: {vehicleItem.id}</Mono>
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
                  onChange={(value) => {
                    setSelectedReg(value);
                    void fetchVehicleByReg(value);
                  }}
                  options={vehicleOptions}
                  placeholder={vehicles.length ? "-- izaberi vozilo --" : "Nema vozila"}
                  disabled={vehicles.length === 0}
                />

                {vehicleByReg && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {vehicleByReg.registration} - {vehicleByReg.mark} {vehicleByReg.model}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {vehicleByReg.color} - {vehicleByReg.year} - ukradeno:{" "}
                      {String(vehicleByReg.isStolen)}
                    </p>
                    <p className="mt-2 text-xs text-slate-300">
                      Vlasnik: {vehicleByReg.owner?.firstName} {vehicleByReg.owner?.lastName} -{" "}
                      {vehicleByReg.owner?.jmbg}
                    </p>
                    <Mono>{vehicleByReg.id}</Mono>
                  </div>
                )}
              </Card>

              <Card title="Vozilo po JMBG vlasnika">
                <Select
                  label="JMBG vlasnika"
                  value={selectedJmbg}
                  onChange={(value) => {
                    setSelectedJmbg(value);
                    void fetchVehicleByJmbg(value);
                  }}
                  options={ownerOptions}
                  placeholder={owners.length ? "-- izaberi vlasnika --" : "Nema vlasnika"}
                  disabled={owners.length === 0}
                />

                {vehicleByJmbg && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {vehicleByJmbg.registration} - {vehicleByJmbg.mark} {vehicleByJmbg.model}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">JMBG vlasnika: {vehicleByJmbg.owner?.jmbg}</p>
                    <Mono>{vehicleByJmbg.id}</Mono>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {active === "drivers" && (
          <>
            <div className="grid gap-6 lg:col-span-2">
              <Card title={`Lista vozaca (${drivers.length})`}>
                <div className="grid gap-3">
                  {drivers.map((driverItem) => (
                    <div
                      key={driverItem.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                    >
                      <p className="text-sm font-semibold">
                        {driverItem.owner?.firstName} {driverItem.owner?.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Poeni: {driverItem.numberOfViolationPoints} - suspendovan:{" "}
                        {String(driverItem.isSuspended)}
                      </p>
                      <Mono>{driverItem.id}</Mono>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card title="Vozac po ID-u">
                <Select
                  label="Vozac"
                  value={selectedDriverId}
                  onChange={(value) => {
                    setSelectedDriverId(value);
                    void fetchDriverById(value);
                  }}
                  options={driverOptions}
                  placeholder={drivers.length ? "-- izaberi vozaca --" : "Nema vozaca"}
                  disabled={drivers.length === 0}
                />

                {driverById && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold">
                      {driverById.owner?.firstName} {driverById.owner?.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Poeni: {driverById.numberOfViolationPoints} - suspendovan:{" "}
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
                {owners.map((ownerItem) => (
                  <div
                    key={ownerItem.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                  >
                    <p className="text-sm font-semibold">
                      {ownerItem.firstName} {ownerItem.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{ownerItem.address}</p>
                    <p className="mt-1 text-xs text-slate-300">JMBG: {ownerItem.jmbg}</p>
                    <p className="mt-1 text-xs text-slate-300">Email: {ownerItem.email}</p>
                    <Mono>{ownerItem.id}</Mono>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {active === "transfers" && (
          <div className="lg:col-span-3">
            <Card title={`Prenosi vlasnistva (${transfers.length})`}>
              {transfers.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                  Nema prenosa vlasnistva.
                </div>
              ) : (
                <div className="grid gap-3">
                  {transfers.map((transferItem) => (
                    <div
                      key={transferItem.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                    >
                      <p className="text-sm font-semibold">{transferItem.vehicle?.registration}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        Stari vlasnik: {transferItem.ownerOld?.firstName} {transferItem.ownerOld?.lastName} -
                        novi vlasnik: {transferItem.ownerNew?.firstName} {transferItem.ownerNew?.lastName}
                      </p>
                      <Mono>{transferItem.id}</Mono>
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
