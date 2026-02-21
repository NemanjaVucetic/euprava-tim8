const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "API error")
  }

  // login može da vraća plain json; ako nekad vraća prazno, handle-uj ovde
  return response.json()
}

//
// ======================
// 🔐 AUTH
// ======================
//

export type RegisterRequest = {
  firstName?: string
  lastName?: string
  email?: string
  password: string
  username?: string
}

export type LoginRequest = {
  email?: string
  username?: string
  password: string
}

export type LoginResponse = {
  accessToken?: string
  refreshToken?: string
  token?: string
  user?: any
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiFetch(`/api/auth/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    apiFetch<LoginResponse>(`/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

//
// ======================
// 🚓 MUP VEHICLES SERVICE
// ======================
//

export const mupVehiclesApi = {
  health: () => apiFetch(`/api/mup-vehicles/health`),

  // vehicles
  getVehicles: () => apiFetch(`/api/mup-vehicles/vehicles`),
  getVehicleByRegistration: (registration: string) =>
    apiFetch(`/api/mup-vehicles/vehicles/${encodeURIComponent(registration)}`),
  getVehicleByOwnerJmbg: (jmbg: string) =>
    apiFetch(`/api/mup-vehicles/vehicles/owner/${encodeURIComponent(jmbg)}`),

  // drivers
  getDrivers: () => apiFetch(`/api/mup-vehicles/drivers`),
  getDriverById: (id: string) => apiFetch(`/api/mup-vehicles/drivers/${id}`),

  // owners / transfers / admins
  getOwners: () => apiFetch(`/api/mup-vehicles/owners`),
  getTransfers: () => apiFetch(`/api/mup-vehicles/transfers`),
  getAdmins: () => apiFetch(`/api/mup-vehicles/admins`),
};
//
// ======================
// 🚔 TRAFFIC POLICE SERVICE
// ======================
//

export const authAdminApi = {
  getUsers: () => apiFetch(`/api/auth/users`),

  setUserRole: (id: string, role: "CITIZEN" | "MUP" | "TRAFFIC") =>
    apiFetch(`/api/auth/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

export const trafficPoliceApi = {
  // ===== Violations =====
  getViolations: () => apiFetch<any[]>(`/api/traffic-police/violations`),
  getViolationById: (id: string) => apiFetch<any>(`/api/traffic-police/violations/${id}`),
  createViolation: (data: any) =>
    apiFetch<any>(`/api/traffic-police/violations`, { method: "POST", body: JSON.stringify(data) }),
  getViolationsByDriver: (driverId: string) =>
    apiFetch<any[]>(`/api/traffic-police/violations/driver/${driverId}`),

  // ===== NEW: Driver Report (This was missing!) =====
  getDriverReport: (driverId: string) =>
    apiFetch<{ totalViolations: number; riskLevel: string }>(
      `/api/traffic-police/drivers/${driverId}/report`
    ),

  // ===== Police =====
  getPolice: () => apiFetch<any[]>(`/api/traffic-police/police`),
  createPolice: (data: any) =>
    apiFetch<any>(`/api/traffic-police/police`, { method: "POST", body: JSON.stringify(data) }),
  togglePoliceSuspend: (id: string) =>
    apiFetch<any>(`/api/traffic-police/police/${id}/toggle-suspend`, { method: "PATCH" }),
  upgradePoliceRank: (id: string) =>
    apiFetch<any>(`/api/traffic-police/police/${id}/upgrade-rank`, { method: "PATCH" }),
  downgradePoliceRank: (id: string) =>
    apiFetch<any>(`/api/traffic-police/police/${id}/downgrade-rank`, { method: "PATCH" }),

  // ===== Owners =====
  getOwners: () => apiFetch<any[]>(`/api/traffic-police/owners`),
  getOwnerById: (id: string) => apiFetch<any>(`/api/traffic-police/owners/${id}`),
  createOwner: (data: any) =>
    apiFetch<any>(`/api/traffic-police/owners`, { method: "POST", body: JSON.stringify(data) }),

  // ===== Vehicles =====
  getVehicles: () => apiFetch<any[]>(`/api/traffic-police/vehicles`),
  getVehicleById: (id: string) => apiFetch<any>(`/api/traffic-police/vehicles/${id}`),
  createVehicle: (data: any) =>
    apiFetch<any>(`/api/traffic-police/vehicles`, { method: "POST", body: JSON.stringify(data) }),
  searchVehicles: (data: any) =>
    apiFetch<any>(`/api/traffic-police/vehicles/search`, { method: "POST", body: JSON.stringify(data) }),
  verifyVehicle: (data: any) =>
    apiFetch<{ valid: boolean; reason?: string }>(`/api/traffic-police/vehicles/verify`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // ===== Transfers =====
  getTransfers: () => apiFetch<any[]>(`/api/traffic-police/transfers`),
  createTransfer: (data: any) =>
    apiFetch<any>(`/api/traffic-police/transfers`, { method: "POST", body: JSON.stringify(data) }),
};

