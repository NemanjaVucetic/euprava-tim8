package data

import (
	"auth/types"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(host, user, password, dbname string, port int) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable", host, user, password, dbname, port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}

func AutoMigrateAndSeed(db *gorm.DB) error {
	if err := db.AutoMigrate(&types.User{}); err != nil {
		return err
	}

	var existing types.User
	err := db.Where("email = ?", "traffic.high@euprava.rs").First(&existing).Error
	if err == nil {
		return nil
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	seedUser := types.User{
		BaseModel: types.BaseModel{ID: "SEED-TRAFFIC-HIGH"},
		Email:     "traffic.high@euprava.rs",
		Password:  string(hash),
		FirstName: "Nikola",
		LastName:  "Policajac",
		Role:      types.RoleTraffic,
	}

	return db.Create(&seedUser).Error
}
