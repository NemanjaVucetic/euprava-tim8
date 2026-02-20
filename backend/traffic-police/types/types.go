package types

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"gorm.io/gorm"
)

//
// ===== Base =====
//

type BaseModel struct {
	ID        string    `json:"id" gorm:"primaryKey;type:text"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = "id"
	}
	return nil
}

//
// ===== Enums =====
//

type TypeOfViolation string

const (
	ViolationMinor    TypeOfViolation = "MINOR"
	ViolationMajor    TypeOfViolation = "MAJOR"
	ViolationCritical TypeOfViolation = "CRITICAL"
)

type Rank string

const (
	RankLow    Rank = "LOW"
	RankMedium Rank = "MEDIUM"
	RankHigh   Rank = "HIGH"
)

//
// ===== Owner (OwnerDTO) =====
//

type Owner struct {
	BaseModel
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Address   string `json:"address"`
	JMBG      string `json:"jmbg" gorm:"uniqueIndex"`
	Email     string `json:"email"`
}

//
// ===== Driver (DriverIDDTO -> DB model) =====
//

type Driver struct {
	BaseModel
	IsSuspended             bool   `json:"isSuspended"`
	NumberOfViolationPoints int    `json:"numberOfViolationPoints"`
	Picture                 string `json:"picture"`

	OwnerID string `json:"ownerId" gorm:"index"`
	Owner   Owner  `json:"owner" gorm:"foreignKey:OwnerID;references:ID"`
}

//
// ===== PolicePerson =====
//

type PolicePerson struct {
	BaseModel
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Rank        Rank   `json:"rank" gorm:"type:text"`
	IsSuspended bool   `json:"isSuspended"`
	Email       string `json:"email" gorm:"uniqueIndex"`
	Password    string `json:"password"`
}

//
// ===== Vehicle (VehicleDTO -> DB model) =====
//

type Vehicle struct {
	BaseModel
	Mark         string `json:"mark"`
	Model        string `json:"model"`
	Registration string `json:"registration" gorm:"uniqueIndex"`
	Year         int    `json:"year"`
	Color        string `json:"color"`
	IsStolen     bool   `json:"isStolen"`

	OwnerID string `json:"ownerId" gorm:"index"`
	Owner   Owner  `json:"owner" gorm:"foreignKey:OwnerID;references:ID"`
}

//
// ===== Violation =====
//

type Violation struct {
	BaseModel
	TypeOfViolation TypeOfViolation `json:"typeOfViolation" gorm:"type:text"`
	Date            time.Time       `json:"date"`
	Location        string          `json:"location"`

	DriverID  string `json:"driverId" gorm:"index"`
	VehicleID string `json:"vehicleId" gorm:"index"`
	PoliceID  string `json:"policeId" gorm:"index"`
}

//
// ===== Fine =====
//

type Fine struct {
	BaseModel
	Amount      float64   `json:"amount"`
	IsPaid      bool      `json:"isPaid"`
	Date        time.Time `json:"date"`
	ViolationID string    `json:"violationId" gorm:"index"`
}

//
// ===== OwnershipTransfer (OwnershipTransferDTO -> DB model) =====
//

type OwnershipTransfer struct {
	BaseModel
	VehicleID      string    `json:"vehicleId" gorm:"index"`
	Vehicle        Vehicle   `json:"vehicle" gorm:"foreignKey:VehicleID;references:ID"`
	OwnerOldID     string    `json:"ownerOldId" gorm:"index"`
	OwnerOld       Owner     `json:"ownerOld" gorm:"foreignKey:OwnerOldID;references:ID"`
	OwnerNewID     string    `json:"ownerNewId" gorm:"index"`
	OwnerNew       Owner     `json:"ownerNew" gorm:"foreignKey:OwnerNewID;references:ID"`
	DateOfTransfer time.Time `json:"dateOfTransfer"`
}

//
// ===== Requests / DTOs (ne migriraju se!) =====
//

// Java: VehicleVerificationRequest
type VehicleVerificationRequest struct {
	Registration string `json:"registration"`
	JMBG         string `json:"jmbg"`
}

// Java: SearchVehicleRequest
type SearchVehicleRequest struct {
	Mark         string `json:"mark"`
	Model        string `json:"model"`
	Color        string `json:"color"`
	Registration string `json:"registration"`
}

// Java: SuspendDriverIdRequest
type SuspendDriverIdRequest struct {
	DriverID                string `json:"driverId"`
	NumberOfViolationPoints int    `json:"numberOfViolationPoints"`
}

// Java: NewViolationRequest { Violation violation; DriverIDDTO driverId; }
type NewViolationRequest struct {
	Violation Violation `json:"violation"`
	DriverID  DriverRef `json:"driverId"`
}

// driverId dolazi kao objekat { "id": "..." }
type DriverRef struct {
	ID string `json:"id"`
}

type User struct {
	ID        uint   `gorm:"primaryKey" json:"ID"`
	Email     string `gorm:"unique;not null" json:"email"`
	Password  string `gorm:"not null" json:"password"`
	FirstName string `gorm:"not null" json:"firstName"`
	LastName  string `gorm:"not null" json:"lastName"`
	Role      Role   `gorm:"not null" json:"role"`
}

type Role string

const (
	Admin   Role = "CITIZEN"
	Student Role = "MUP"
	Teacher Role = "TRAFFIC"
)

type LoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type LoginResp struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type MupOwner struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	JMBG      string `json:"jmbg"`
	Email     string `json:"email"`
	Address   string `json:"address"`
}

type MupVehicle struct {
	ID           string   `json:"id"`
	Registration string   `json:"registration"`
	Mark         string   `json:"mark"`
	Model        string   `json:"model"`
	Year         int      `json:"year"`
	Color        string   `json:"color"`
	IsStolen     bool     `json:"isStolen"`
	Owner        MupOwner `json:"owner"`
}

type MupDriver struct {
	ID                      string   `json:"id"`
	IsSuspended             bool     `json:"isSuspended"`
	NumberOfViolationPoints int      `json:"numberOfViolationPoints"`
	Picture                 string   `json:"picture"`
	Owner                   MupOwner `json:"owner"`
}

type pointsReq struct {
	Delta int `json:"delta"`
}

func mupGet[T any](client *http.Client, baseURL, path string) (*T, int, error) {
	req, err := http.NewRequest("GET", baseURL+path, nil)
	if err != nil {
		return nil, 0, err
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, res.StatusCode, nil
	}

	var out T
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, res.StatusCode, err
	}
	return &out, res.StatusCode, nil
}

func mupPatchJSON[T any](client *http.Client, baseURL, path string, body any) (*T, int, error) {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest("PATCH", baseURL+path, bytes.NewReader(b))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, res.StatusCode, nil
	}

	var out T
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, res.StatusCode, err
	}
	return &out, res.StatusCode, nil
}
