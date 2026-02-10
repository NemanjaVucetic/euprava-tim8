package main

import (
	"auth/config"
	"auth/data"
	"auth/user"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	cfg := config.GetConfig()

	db, err := data.InitDB(cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, 5432)

	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}
	// if err = data.AutoMigrate(db); err != nil {
	// 	panic(err)
	// }

	// Release mode
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	if err := router.SetTrustedProxies(nil); err != nil {
		panic("Error setting trusted proxies")
	}

	api := router.Group("")

	user.WithUserAPI(api, db)

	url := fmt.Sprintf("%s:%d", cfg.ServiceHost, cfg.ServicePort)

	if err := router.Run(url); err != nil {
		log.Fatal("greska prilikom pokretanja servera", err)
	}
}
