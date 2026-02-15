package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"

	"traffic-police/config"
	"traffic-police/data"
	"traffic-police/models"
	"traffic-police/service"
)

func main() {

	cfg := config.GetConfig()

	// DB
	db, err := data.InitDB(cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, 5432)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}
	if err = data.AutoMigrate(db); err != nil {
		panic(err)
	}

	store := service.NewStore(db)

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ===== Police =====
	r.POST("/police", func(c *gin.Context) {
		var p models.PolicePerson
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := store.CreatePolice(&p); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(201, p)
	})

	r.GET("/police", func(c *gin.Context) {
		var list []models.PolicePerson
		if err := store.ListPolice(&list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	r.GET("/police/:id", func(c *gin.Context) {
		var p models.PolicePerson
		if err := store.GetPolice(c.Param("id"), &p); err != nil {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, p)
	})

	r.PATCH("/police/:id/toggle-suspend", func(c *gin.Context) {
		var p models.PolicePerson
		if err := store.TogglePoliceSuspend(c.Param("id"), &p); err != nil {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, p)
	})

	// ===== Owners =====
	r.POST("/owners", func(c *gin.Context) {
		var o models.Owner
		if err := c.ShouldBindJSON(&o); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := store.CreateOwner(&o); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(201, o)
	})

	r.GET("/owners", func(c *gin.Context) {
		var list []models.Owner
		if err := store.ListOwners(&list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	r.GET("/owners/:id", func(c *gin.Context) {
		var o models.Owner
		if err := store.GetOwner(c.Param("id"), &o); err != nil {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, o)
	})

	// ===== Vehicles =====
	r.POST("/vehicles", func(c *gin.Context) {
		var v models.Vehicle
		if err := c.ShouldBindJSON(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := store.CreateVehicle(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		_ = store.GetVehicle(v.ID, &v)
		c.JSON(201, v)
	})

	r.GET("/vehicles", func(c *gin.Context) {
		var list []models.Vehicle
		if err := store.ListVehicles(&list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	r.GET("/vehicles/:id", func(c *gin.Context) {
		var v models.Vehicle
		if err := store.GetVehicle(c.Param("id"), &v); err != nil {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, v)
	})

	r.POST("/vehicles/search", func(c *gin.Context) {
		var req models.SearchVehicleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		var list []models.Vehicle
		if err := store.SearchVehicles(req, &list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	r.POST("/vehicles/verify", func(c *gin.Context) {
		var req models.VehicleVerificationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		ok, veh, err := store.VerifyVehicle(req)
		if err != nil {
			c.JSON(404, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"valid": ok, "vehicle": veh})
	})

	// ===== Violations =====
	r.POST("/violations", func(c *gin.Context) {
		var v models.Violation
		if err := c.ShouldBindJSON(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := store.CreateViolation(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(201, v)
	})

	r.GET("/violations", func(c *gin.Context) {
		var list []models.Violation
		if err := store.ListViolations(&list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	r.GET("/violations/:id", func(c *gin.Context) {
		var v models.Violation
		if err := store.GetViolation(c.Param("id"), &v); err != nil {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, v)
	})

	r.GET("/violations/driver/:driverId", func(c *gin.Context) {
		var list []models.Violation
		if err := store.ListViolationsByDriver(c.Param("driverId"), &list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	// ===== Transfers =====
	r.POST("/transfers", func(c *gin.Context) {
		var t models.OwnershipTransfer
		if err := c.ShouldBindJSON(&t); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := store.CreateTransfer(&t); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(201, t)
	})

	r.GET("/transfers", func(c *gin.Context) {
		var list []models.OwnershipTransfer
		if err := store.ListTransfers(&list); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, list)
	})

	addr := fmt.Sprintf("%s:%d", cfg.ServiceHost, cfg.ServicePort)
	if err := r.Run(addr); err != nil {
		log.Fatal("greska prilikom pokretanja servera: ", err)
	}
}
