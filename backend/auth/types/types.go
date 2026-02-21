package types

import (
	"math/rand"
	"time"
)

type BaseModel struct {
	ID        string    `json:"id" gorm:"primaryKey;type:text"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func generateID(n int) string {
	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	s := make([]rune, n)
	for i := range s {
		s[i] = letters[rand.Intn(len(letters))]
	}
	return string(s)
}

type User struct {
	BaseModel        // ima ID string + BeforeCreate koji generiše random ID
	Email     string `gorm:"unique;not null" json:"email"`
	Password  string `gorm:"not null" json:"password"`
	FirstName string `gorm:"not null" json:"firstName"`
	LastName  string `gorm:"not null" json:"lastName"`
	Role      Role   `gorm:"not null" json:"role"`
}
type Role string

const (
	RoleCitizen Role = "CITIZEN"
	RoleMup     Role = "MUP"
	RoleTraffic Role = "TRAFFIC"
)

type LoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type LoginResp struct {
	Role        string `json:"role"`
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type MupDriver struct {
	ID                      string   `json:"id"`
	IsSuspended             bool     `json:"isSuspended"`
	NumberOfViolationPoints int      `json:"numberOfViolationPoints"`
	Picture                 string   `json:"picture"`
	Owner                   MupOwner `json:"owner"`
}

type MupOwner struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Address   string `json:"address"`
	JMBG      string `json:"jmbg"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type MupVehicle struct {
	ID           string   `json:"id"`
	Mark         string   `json:"mark"`
	Model        string   `json:"model"`
	Registration string   `json:"registration"`
	Year         int      `json:"year"`
	Color        string   `json:"color"`
	IsStolen     bool     `json:"isStolen"`
	Owner        MupOwner `json:"owner"`
}
