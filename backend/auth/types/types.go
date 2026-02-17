package types

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
