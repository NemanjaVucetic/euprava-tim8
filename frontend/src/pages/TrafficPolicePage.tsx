export default function TrafficPolicePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold">Provera kazni / prekršaja</h2>
        <p className="mt-1 text-sm text-slate-400">Unesi JMBG ili broj vozačke dozvole.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="JMBG"
          />
          <input
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Broj vozačke dozvole"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400">
            Proveri
          </button>
          <button className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            Reset
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm font-semibold">Evidencija (demo)</p>
          <p className="mt-1 text-sm text-slate-400">
            Ovdje kasnije prikažeš listu kazni iz “saobraćajna policija” mikroservisa.
          </p>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Pregled</h3>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400">Aktivne kazne</p>
            <p className="mt-1 text-2xl font-semibold">2</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400">Ukupno prekršaja</p>
            <p className="mt-1 text-2xl font-semibold">7</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 text-sm text-slate-300">
          Kasnije: filteri po datumu, statusu, iznosu.
        </div>
      </aside>
    </div>
  );
}
