package data

import (
	"fmt"
	"traffic-police/models"

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

func AutoMigrate(db *gorm.DB) error {

	err := db.AutoMigrate(
		&models.PoliceProfile{},
		&models.Owner{},
		&models.Vehicle{},
		&models.Violation{},
		&models.OwnershipTransfer{},
		&models.Driver{},
		&models.Fine{},
		&models.User{},
	)
	if err != nil {
		return err
	}

	return nil
}

func SeedDefaultPolice(db *gorm.DB) error {
	var existing models.User
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

	seed := models.User{
		BaseModel: models.BaseModel{ID: "SEED-TP-HIGH"},
		Email:     "traffic.high@euprava.rs",
		Password:  string(hash),
		Role:      models.UserRoleTraffic,
		PoliceProfile: &models.PoliceProfile{
			FirstName:   "Nikola",
			LastName:    "Policajac",
			Rank:        models.RankHigh,
			IsSuspended: false,
		},
	}

	return db.Create(&seed).Error
}
