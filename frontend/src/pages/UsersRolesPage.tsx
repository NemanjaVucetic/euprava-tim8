import { useEffect, useMemo, useState } from "react";
import Select from "../components/Select";
import { authAdminApi } from "../api/queries";

type Role = "CITIZEN" | "MUP" | "TRAFFIC";

type UserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role | string;
};

function roleLabel(role: Role): string {
  switch (role) {
    case "CITIZEN":
      return "Gradjanin";
    case "MUP":
      return "MUP";
    case "TRAFFIC":
      return "Saobracajna policija";
    default:
      return role;
  }
}

export default function UsersRolesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      { value: "CITIZEN" as Role, label: roleLabel("CITIZEN") },
      { value: "MUP" as Role, label: roleLabel("MUP") },
      { value: "TRAFFIC" as Role, label: roleLabel("TRAFFIC") },
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
      setError(e?.message || "Ne mogu da ucitam korisnike.");
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
      setError(e?.message || "Ne mogu da sacuvam rolu.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Korisnici i role</h2>
          <p className="mt-1 text-sm text-slate-400">Dodela rola korisnicima.</p>
        </div>

        <button
          onClick={loadUsers}
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

      <div className="mt-6 grid gap-3">
        {users.length === 0 && !loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
            Trenutno nema korisnika.
          </div>
        ) : (
          users.map((userRow) => (
            <div
              key={userRow.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {(userRow.firstName || "-") + " " + (userRow.lastName || "")}
                  </p>
                  <p className="text-xs text-slate-400">{userRow.email || "-"}</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{userRow.id}</p>
                </div>

                <div className="min-w-[260px]">
                  <Select
                    label="Rola"
                    value={(userRow.role as Role) || ("CITIZEN" as Role)}
                    onChange={(selectedRole) => changeRole(userRow.id, selectedRole)}
                    options={roleOptions}
                    disabled={savingId === userRow.id}
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
