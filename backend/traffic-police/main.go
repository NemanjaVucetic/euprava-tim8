package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"traffic-police/config"
	"traffic-police/data"
	"traffic-police/models"
	"traffic-police/service"
)

//
// ===== MUP DTOs =====
//

type MupOwner struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Address   string `json:"address"`
	JMBG      string `json:"jmbg"`
	Email     string `json:"email"`
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

type MupDriver struct {
	ID                      string   `json:"id"`
	IsSuspended             bool     `json:"isSuspended"`
	NumberOfViolationPoints int      `json:"numberOfViolationPoints"`
	Picture                 string   `json:"picture"`
	Owner                   MupOwner `json:"owner"`
}

type pointsReq struct {
	Delta int `json:"delta"`
}

//
// ===== HTTP helpers =====
//

func mupGet[T any](client *http.Client, baseURL, path string) (*T, int, error) {
	req, err := http.NewRequest("GET", baseURL+path, nil)
	if err != nil {
		return nil, 0, err
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, res.StatusCode, nil
	}

	var out T
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, res.StatusCode, err
	}
	return &out, res.StatusCode, nil
}

func mupPatchJSON[T any](client *http.Client, baseURL, path string, body any) (*T, int, error) {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest("PATCH", baseURL+path, bytes.NewReader(b))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, res.StatusCode, nil
	}

	var out T
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, res.StatusCode, err
	}
	return &out, res.StatusCode, nil
}

func main() {
	cfg := config.GetConfig()

	httpClient := &http.Client{
		Timeout: time.Duration(cfg.MupTimeoutMs) * time.Millisecond,
	}

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

	// ===== VEHICLE VERIFY (inter-service) =====
	r.POST("/vehicles/verify", func(c *gin.Context) {
		var req models.VehicleVerificationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		veh, st, err := mupGet[MupVehicle](httpClient, cfg.MupBaseURL, "/vehicles/"+req.Registration)
		if err != nil {
			c.JSON(500, gin.H{"error": "mup request failed"})
			return
		}
		if st == 404 || veh == nil {
			c.JSON(200, gin.H{"valid": false, "reason": "vehicle not found"})
			return
		}

		vehByJmbg, st2, err := mupGet[MupVehicle](httpClient, cfg.MupBaseURL, "/vehicles/owner/"+req.JMBG)
		if err != nil {
			c.JSON(500, gin.H{"error": "mup request failed"})
			return
		}
		if st2 == 404 || vehByJmbg == nil {
			c.JSON(200, gin.H{"valid": false, "reason": "no vehicle for owner jmbg"})
			return
		}

		valid := (veh.Owner.JMBG == req.JMBG) && (veh.Registration == vehByJmbg.Registration)
		c.JSON(200, gin.H{"valid": valid, "vehicle": veh})
	})

	// ===== Violations (inter-service business rules) =====
	r.POST("/violations", func(c *gin.Context) {
		var v models.Violation
		if err := c.ShouldBindJSON(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// vehicleId comes as registration string
		registration := fmt.Sprintf("%v", v.VehicleID)
		veh, vSt, err := mupGet[MupVehicle](httpClient, cfg.MupBaseURL, "/vehicles/"+registration)
		if err != nil {
			c.JSON(500, gin.H{"error": "mup vehicles request failed"})
			return
		}
		if vSt == 404 || veh == nil {
			c.JSON(400, gin.H{"error": "invalid vehicle registration"})
			return
		}
		if veh.IsStolen {
			v.TypeOfViolation = "CRITICAL"
		}

		driverId := fmt.Sprintf("%v", v.DriverID)
		driver, dSt, err := mupGet[MupDriver](httpClient, cfg.MupBaseURL, "/drivers/"+driverId)
		if err != nil {
			c.JSON(500, gin.H{"error": "mup drivers request failed"})
			return
		}
		if dSt == 404 || driver == nil {
			c.JSON(400, gin.H{"error": "invalid driver id"})
			return
		}
		if driver.IsSuspended {
			c.JSON(409, gin.H{"error": "driver is suspended - cannot create violation"})
			return
		}

		if err := store.CreateViolation(&v); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// points
		delta := 1
		switch v.TypeOfViolation {
		case "MAJOR":
			delta = 3
		case "CRITICAL":
			delta = 5
		default:
			delta = 1
		}

		updatedDriver, pSt, err := mupPatchJSON[MupDriver](
			httpClient,
			cfg.MupBaseURL,
			"/drivers/"+driverId+"/points",
			pointsReq{Delta: delta},
		)

		if err != nil || pSt >= 400 || updatedDriver == nil {
			c.JSON(201, gin.H{
				"violation": v,
				"vehicle":   veh,
				"warning":   "violation created but mup points update failed",
			})
			return
		}

		c.JSON(201, gin.H{
			"violation": v,
			"vehicle":   veh,
			"driver":    updatedDriver,
		})
	})

	// Add this to your main.go
	r.GET("/drivers/:id/report", func(c *gin.Context) {
		var violations []models.Violation
		store.ListViolationsByDriver(c.Param("id"), &violations)

		score := 0
		for _, v := range violations {
			if v.TypeOfViolation == "CRITICAL" {
				score += 10
			}
			if v.TypeOfViolation == "MAJOR" {
				score += 5
			}
			if v.TypeOfViolation == "MINOR" {
				score += 2
			}
		}

		riskLevel := "LOW"
		if score > 20 {
			riskLevel = "HIGH"
		} else if score > 10 {
			riskLevel = "MEDIUM"
		}

		c.JSON(200, gin.H{
			"driver_id":        c.Param("id"),
			"total_violations": len(violations),
			"risk_score":       score,
			"risk_level":       riskLevel,
		})
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

	// ===== Transfers (ostavljeno kao ranije) =====
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
