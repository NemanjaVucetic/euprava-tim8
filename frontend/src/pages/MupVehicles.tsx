export default function MupVehiclesPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold">Pretraga vozila</h2>
        <p className="mt-1 text-sm text-slate-400">Unesi registraciju ili broj šasije.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Registracija (npr. NS-123-AB)"
          />
          <input
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="VIN / broj šasije"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400">
            Pretraži
          </button>
          <button className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            Reset
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm font-semibold">Rezultat (demo)</p>
          <p className="mt-1 text-sm text-slate-400">
            Ovdje ćeš kasnije prikazati podatke iz MUP mikroservisa.
          </p>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Brze akcije</h3>
        <div className="mt-4 space-y-2">
          <button className="w-full rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Registruj vozilo
          </button>
          <button className="w-full rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Promeni vlasništvo
          </button>
          <button className="w-full rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Provera statusa registracije
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 text-sm text-slate-300">
          Tip: ovde možeš kasnije dodati “Service status” (health check) za microservice.
        </div>
      </aside>
    </div>
  );
}
