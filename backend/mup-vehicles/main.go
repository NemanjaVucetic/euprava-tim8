package main

import (
	"fmt"
	"log"
	"math/rand"
	"mup-vehicles/config"
	"time"

	"github.com/gin-gonic/gin"
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
	rand.Seed(time.Now().UnixNano())

	firstNames := []string{"Marko", "Jovan", "Ana", "Milica", "Petar", "Nikola", "Ivana", "Stefan", "Mina", "Luka"}
	lastNames := []string{"Markovic", "Jovanovic", "Petrovic", "Nikolic", "Ilic", "Savic", "Stojanovic", "Kovacevic"}
	streets := []string{"Bulevar Oslobodjenja", "Cara Dusana", "Zmaj Jovina", "Bulevar Evrope", "Narodnog Fronta", "Temerinska", "Kralja Petra"}

	marks := []string{"Audi", "BMW", "Volkswagen", "Skoda", "Opel", "Toyota", "Peugeot", "Renault"}
	modelsByMark := map[string][]string{
		"Audi":       {"A3", "A4", "A6"},
		"BMW":        {"320d", "X3", "X5"},
		"Volkswagen": {"Golf", "Passat", "Polo"},
		"Skoda":      {"Octavia", "Fabia", "Superb"},
		"Opel":       {"Astra", "Corsa", "Insignia"},
		"Toyota":     {"Corolla", "Yaris", "RAV4"},
		"Peugeot":    {"208", "308", "3008"},
		"Renault":    {"Clio", "Megane", "Kadjar"},
	}
	colors := []string{"Black", "White", "Gray", "Blue", "Red", "Silver"}

	// --- owners ---
	owners = make([]Owner, 0, 8)
	for i := 0; i < 8; i++ {
		fn := firstNames[rand.Intn(len(firstNames))]
		ln := lastNames[rand.Intn(len(lastNames))]
		jmbg := fmt.Sprintf("0%d0%d99%05d%02d", rand.Intn(9)+1, rand.Intn(9)+1, rand.Intn(99999), i+1)

		o := Owner{
			ID:        fmt.Sprintf("OWN-%d", i+1), // Simple String ID
			FirstName: fn,
			LastName:  ln,
			Address:   fmt.Sprintf("%s %d", streets[rand.Intn(len(streets))], rand.Intn(99)+1),
			JMBG:      jmbg,
			Email:     fmt.Sprintf("%s.%s%d@mail.com", fn, ln, i+1),
		}
		owners = append(owners, o)
	}

	// --- vehicles ---
	vehicles = make([]Vehicle, 0, 10)
	regs := []string{"NS-123-AB", "NS-456-CD", "BG-111-AA", "BG-222-BB", "SU-777-ZZ", "NI-333-CC", "KG-999-DD", "ZR-101-EE", "PA-202-FF", "SM-303-GG"}
	for i := 0; i < 10; i++ {
		mk := marks[rand.Intn(len(marks))]
		md := modelsByMark[mk][rand.Intn(len(modelsByMark[mk]))]
		yr := 2008 + rand.Intn(17)
		stolen := rand.Intn(10) == 0

		v := Vehicle{
			ID:           fmt.Sprintf("VEH-%d", i+1), // Simple String ID
			Mark:         mk,
			Model:        md,
			Registration: regs[i%len(regs)],
			Year:         yr,
			Color:        colors[rand.Intn(len(colors))],
			IsStolen:     stolen,
			Owner:        owners[rand.Intn(len(owners))],
		}
		vehicles = append(vehicles, v)
	}

	// --- drivers ---
	drivers = make([]DriverId, 0, 8)
	for i := 0; i < 8; i++ {
		points := rand.Intn(12)
		susp := points >= 10

		d := DriverId{
			ID:                      fmt.Sprintf("DRV-%d", i+1), // Simple String ID
			IsSuspended:             susp,
			NumberOfViolationPoints: points,
			Picture:                 fmt.Sprintf("driver%d.jpg", i+1),
			Owner:                   owners[i%len(owners)],
		}
		drivers = append(drivers, d)
	}

	// --- admins ---
	admins = []Administrator{
		{
			ID:        "ADM-1",
			FirstName: "Admin",
			LastName:  "MUP",
			Email:     "admin@mup.rs",
			Password:  "123",
		},
		{
			ID:        "ADM-2",
			FirstName: "Supervisor",
			LastName:  "MUP",
			Email:     "supervisor@mup.rs",
			Password:  "123",
		},
	}

	// --- transfers ---
	transfers = make([]OwnershipTransfer, 0, 3)
	for i := 0; i < 3; i++ {
		oldOwner := owners[rand.Intn(len(owners))]
		newOwner := owners[rand.Intn(len(owners))]
		for newOwner.ID == oldOwner.ID {
			newOwner = owners[rand.Intn(len(owners))]
		}
		veh := vehicles[rand.Intn(len(vehicles))]

		t := OwnershipTransfer{
			ID:             fmt.Sprintf("TRA-%d", i+1), // Simple String ID
			Vehicle:        veh,
			OldOwner:       oldOwner,
			NewOwner:       newOwner,
			DateOfTransfer: time.Now().AddDate(0, -rand.Intn(12), -rand.Intn(28)),
		}
		transfers = append(transfers, t)
	}
}

// ... rest of main() and routes stay exactly as they were ...

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

	// PATCH /drivers/:id/points   body: { "delta": 2 }
	type PointsUpdateRequest struct {
		Delta int `json:"delta"`
	}

	r.PATCH("/drivers/:id/points", func(c *gin.Context) {
		id := c.Param("id")

		var req PointsUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		for i := range drivers {
			if drivers[i].ID == id {
				drivers[i].NumberOfViolationPoints += req.Delta
				if drivers[i].NumberOfViolationPoints < 0 {
					drivers[i].NumberOfViolationPoints = 0
				}

				// prag (menjaj po potrebi)
				if drivers[i].NumberOfViolationPoints >= 10 {
					drivers[i].IsSuspended = true
				}

				c.JSON(200, drivers[i])
				return
			}
		}

		c.JSON(404, gin.H{"error": "driver not found"})
	})

	// PATCH /drivers/:id/suspend  body: { "isSuspended": true/false }
	type SuspendRequest struct {
		IsSuspended bool `json:"isSuspended"`
	}

	r.PATCH("/drivers/:id/suspend", func(c *gin.Context) {
		id := c.Param("id")

		var req SuspendRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		for i := range drivers {
			if drivers[i].ID == id {
				drivers[i].IsSuspended = req.IsSuspended
				c.JSON(200, drivers[i])
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
