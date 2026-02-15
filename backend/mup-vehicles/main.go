package main

import (
	"fmt"
	"log"
	"mup-vehicles/config"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

//
// ===== MODELS =====
//

type Administrator struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type Owner struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Address   string `json:"address"`
	JMBG      string `json:"jmbg"`
	Email     string `json:"email"`
}

type DriverId struct {
	ID                      string `json:"id"`
	IsSuspended             bool   `json:"isSuspended"`
	NumberOfViolationPoints int    `json:"numberOfViolationPoints"`
	Picture                 string `json:"picture"`
	Owner                   Owner  `json:"owner"`
}

type Vehicle struct {
	ID           string `json:"id"`
	Mark         string `json:"mark"`
	Model        string `json:"model"`
	Registration string `json:"registration"`
	Year         int    `json:"year"`
	Color        string `json:"color"`
	IsStolen     bool   `json:"isStolen"`
	Owner        Owner  `json:"owner"`
}

type OwnershipTransfer struct {
	ID             string    `json:"id"`
	Vehicle        Vehicle   `json:"vehicle"`
	OldOwner       Owner     `json:"oldOwner"`
	NewOwner       Owner     `json:"newOwner"`
	DateOfTransfer time.Time `json:"dateOfTransfer"`
}

//
// ===== MOCK DATA =====
//

var owners []Owner
var vehicles []Vehicle
var drivers []DriverId
var transfers []OwnershipTransfer
var admins []Administrator

func seedData() {
	owner1 := Owner{
		ID:        uuid.NewString(),
		FirstName: "Marko",
		LastName:  "Markovic",
		Address:   "Bulevar Oslobodjenja 1",
		JMBG:      "0101990500001",
		Email:     "marko@mail.com",
	}

	owner2 := Owner{
		ID:        uuid.NewString(),
		FirstName: "Jovan",
		LastName:  "Jovanovic",
		Address:   "Cara Dusana 10",
		JMBG:      "0202990500002",
		Email:     "jovan@mail.com",
	}

	vehicle1 := Vehicle{
		ID:           uuid.NewString(),
		Mark:         "Audi",
		Model:        "A4",
		Registration: "NS-123-AB",
		Year:         2018,
		Color:        "Black",
		IsStolen:     false,
		Owner:        owner1,
	}

	driver1 := DriverId{
		ID:                      uuid.NewString(),
		IsSuspended:             false,
		NumberOfViolationPoints: 3,
		Picture:                 "driver1.jpg",
		Owner:                   owner1,
	}

	admin1 := Administrator{
		ID:        uuid.NewString(),
		FirstName: "Admin",
		LastName:  "MUP",
		Email:     "admin@mup.rs",
		Password:  "123",
	}

	owners = []Owner{owner1, owner2}
	vehicles = []Vehicle{vehicle1}
	drivers = []DriverId{driver1}
	admins = []Administrator{admin1}
}

//
// ===== MAIN =====
//

func main() {
	seedData()
	cfg := config.GetConfig()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"service": "mup-vehicles", "status": "ok"})
	})

	// ===== VEHICLES =====

	r.GET("/vehicles", func(c *gin.Context) {
		c.JSON(200, vehicles)
	})

	r.GET("/vehicles/:registration", func(c *gin.Context) {
		reg := c.Param("registration")
		for _, v := range vehicles {
			if v.Registration == reg {
				c.JSON(200, v)
				return
			}
		}
		c.JSON(404, gin.H{"error": "vehicle not found"})
	})

	// endpoint koji drugi servis moze da koristi
	r.GET("/vehicles/owner/:jmbg", func(c *gin.Context) {
		jmbg := c.Param("jmbg")
		for _, v := range vehicles {
			if v.Owner.JMBG == jmbg {
				c.JSON(200, v)
				return
			}
		}
		c.JSON(404, gin.H{"error": "vehicle not found"})
	})

	// ===== DRIVERS =====

	r.GET("/drivers", func(c *gin.Context) {
		c.JSON(200, drivers)
	})

	r.GET("/drivers/:id", func(c *gin.Context) {
		id := c.Param("id")
		for _, d := range drivers {
			if d.ID == id {
				c.JSON(200, d)
				return
			}
		}
		c.JSON(404, gin.H{"error": "driver not found"})
	})

	// ===== OWNERS =====

	r.GET("/owners", func(c *gin.Context) {
		c.JSON(200, owners)
	})

	// ===== TRANSFERS =====

	r.GET("/transfers", func(c *gin.Context) {
		c.JSON(200, transfers)
	})

	// ===== ADMINS =====

	r.GET("/admins", func(c *gin.Context) {
		c.JSON(200, admins)
	})

	addr := fmt.Sprintf("%s:%d", cfg.ServiceHost, cfg.ServicePort)
	if err := r.Run(addr); err != nil {
		log.Fatal("greska prilikom pokretanja servera: ", err)
	}
}
