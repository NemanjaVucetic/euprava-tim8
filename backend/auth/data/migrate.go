package data

import (
	"fmt"
	// "auth/types"
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

// func AutoMigrate(db *gorm.DB) error {

// 	err := db.AutoMigrate(
// 		&types.User{},
// 	)
// 	if err != nil {
// 		return err
// 	}

// 	return nil
// }

