// ======================
// Shared / Base
// ======================

export type UUID = string

export type BaseModel = {
  id: UUID
  createdAt?: string
  updatedAt?: string
}

// ======================
// AUTH
// ======================

export type RegisterRequest = {
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  password: string
}

export type LoginRequest = {
  username?: string
  email?: string
  password: string
}

export type LoginResponse = {
  token?: string
  accessToken?: string
  refreshToken?: string
  user?: any
}

// ======================
// MUP VEHICLES SERVICE
// ======================

export type Administrator = BaseModel & {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type Owner = BaseModel & {
  firstName: string
  lastName: string
  address: string
  jmbg: string
  email: string
}

export type Driver = BaseModel & {
  isSuspended: boolean
  numberOfViolationPoints: number
  picture: string
  ownerId?: UUID
  owner: Owner
}

export type Vehicle = BaseModel & {
  mark: string
  model: string
  registration: string
  year: number
  color: string
  isStolen: boolean
  ownerId?: UUID
  owner: Owner
}

export type OwnershipTransfer = BaseModel & {
  vehicleId?: UUID
  vehicle: Vehicle
  ownerOldId?: UUID
  ownerOld: Owner
  ownerNewId?: UUID
  ownerNew: Owner
  dateOfTransfer: string
}

// ======================
// TRAFFIC POLICE SERVICE
// ======================

export type Rank = "LOW" | "MEDIUM" | "HIGH"

export function formatRank(rank: Rank): string {
  switch (rank) {
    case "LOW":
      return "Policajac"
    case "MEDIUM":
      return "Narednik"
    case "HIGH":
      return "Inspektor"
    default:
      return rank
  }
}

export type PolicePerson = BaseModel & {
  firstName: string
  lastName: string
  rank: Rank
  isSuspended: boolean
  email: string
  password: string
}

export type TypeOfViolation = "MINOR" | "MAJOR" | "CRITICAL"

export function formatViolation(type: TypeOfViolation): string {
  switch (type) {
    case "MINOR":
      return "Manji prekršaj"
    case "MAJOR":
      return "Veći prekršaj"
    case "CRITICAL":
      return "Kritičan prekršaj"
    default:
      return type
  }
}

export type Violation = BaseModel & {
  typeOfViolation: TypeOfViolation
  date: string
  location: string
  driverId: UUID | string
  vehicleId: UUID | string
  policeId: UUID | string
}

export type Fine = BaseModel & {
  amount: number
  isPaid: boolean
  date: string
  violationId: UUID
}

// ======================
// REQUEST DTOs
// ======================
export type PersonalViolation = BaseModel & {
  citizenId: string
  type: TypeOfViolation
  description: string
  status: "PENDING" | "PAID" | "CANCELLED"
}


export type VehicleVerificationRequest = {
  registration: string
  jmbg: string
}

export type SearchVehicleRequest = {
  mark?: string
  model?: string
  color?: string
  registration?: string
}

export type SuspendDriverIdRequest = {
  driverId: UUID | string
  numberOfViolationPoints: number
}

// NewViolationRequest { violation: Violation, driverId: { id: string } }
export type DriverRef = {
  id: UUID | string
}

export type NewViolationRequest = {
  violation: Omit<Violation, "id"> & Partial<Pick<Violation, "id">>
  driverId: DriverRef
}
