package main

import (
	"auth/config"
	"auth/data"
	"auth/user"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.GetConfig()

	db, err := data.InitDB(cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, 5432)

	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	if err := router.SetTrustedProxies(nil); err != nil {
		panic("Error setting trusted proxies")
	}

	api := router.Group("")

	user.WithUserAPI(api, db)

	router.Run(fmt.Sprintf("0.0.0.0:%d", cfg.ServicePort))

}
