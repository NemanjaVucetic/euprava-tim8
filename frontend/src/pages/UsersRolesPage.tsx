import { useEffect, useMemo, useState } from "react";
import Select from "../components/Select";
import { authAdminApi } from "../api/queries";

type Role = "CITIZEN" | "MUP" | "TRAFFIC";

// prilagodi polja onome što auth-service vraća
type UserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role | string;
};

export default function UsersRolesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      { value: "CITIZEN" as Role, label: "CITIZEN" },
      { value: "MUP" as Role, label: "MUP" },
      { value: "TRAFFIC" as Role, label: "TRAFFIC" },
    ],
    []
  );

  async function loadUsers() {
    setError(null);
    setLoading(true);
    try {
      const list = (await authAdminApi.getUsers()) as UserRow[];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(
        e?.message ||
          "Ne mogu da učitam korisnike. Proveri da li backend ima GET /api/auth/users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function changeRole(userId: string, role: Role) {
    setError(null);
    setSavingId(userId);
    try {
      await authAdminApi.setUserRole(userId, role);
      await loadUsers();
    } catch (e: any) {
      setError(
        e?.message ||
          "Ne mogu da sačuvam rolu. Proveri PATCH /api/auth/users/:id/role (body {role})."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Korisnici & role</h2>
          <p className="mt-1 text-sm text-slate-400">
            Dodela role korisnicima (admin deo).
          </p>
        </div>

        <button
          onClick={loadUsers}
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

      <div className="mt-6 grid gap-3">
        {users.length === 0 && !loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
            Nema korisnika (ili endpoint ne vraća listu).
          </div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {(u.firstName || "-") + " " + (u.lastName || "")}
                  </p>
                  <p className="text-xs text-slate-400">{u.email || "-"}</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{u.id}</p>
                </div>

                <div className="min-w-[240px]">
                  <Select
                    label="Role"
                    value={(u.role as Role) || ("CITIZEN" as Role)}
                    onChange={(r) => changeRole(u.id, r)}
                    options={roleOptions}
                    disabled={savingId === u.id}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
