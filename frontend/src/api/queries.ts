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
  getAllVehicles: () => apiFetch(`/api/mup-vehicles/vehicles`),

  getVehicleByRegistration: (registration: string) =>
    apiFetch(`/api/mup-vehicles/vehicles/${registration}`),

  getOwners: () => apiFetch(`/api/mup-vehicles/owners`),

  getDrivers: () => apiFetch(`/api/mup-vehicles/drivers`),

  getTransfers: () => apiFetch(`/api/mup-vehicles/transfers`),

  createTransfer: (data: any) =>
    apiFetch(`/api/mup-vehicles/transfers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

//
// ======================
// 🚔 TRAFFIC POLICE SERVICE
// ======================
//

export const trafficPoliceApi = {
  getViolations: () => apiFetch(`/api/traffic-police/violations`),

  getViolationById: (id: string) => apiFetch(`/api/traffic-police/violations/${id}`),

  createViolation: (data: any) =>
    apiFetch(`/api/traffic-police/violations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getViolationsByDriver: (driverId: string) =>
    apiFetch(`/api/traffic-police/violations/driver/${driverId}`),

  getPolice: () => apiFetch(`/api/traffic-police/police`),

  togglePoliceSuspend: (id: string) =>
    apiFetch(`/api/traffic-police/police/${id}/toggle-suspend`, {
      method: "PATCH",
    }),
}
