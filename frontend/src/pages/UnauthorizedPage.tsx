import { Link, useLocation } from "react-router-dom";

export default function UnauthorizedPage() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
      <h1 className="text-xl font-semibold text-red-200">Nemas pristup ovoj stranici</h1>
      <p className="mt-2 text-sm text-slate-300">
        Pokusao/la si da otvoris: <span className="font-mono">{from || "nepoznata ruta"}</span>
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          to="/"
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Idi na pocetnu
        </Link>
        <Link
          to="/login"
          className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Prijava
        </Link>
      </div>
    </div>
  );
}
