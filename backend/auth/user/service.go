package user

import (
	"auth/types"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// same generic helper as traffic service
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

func getUserByEmail(db *gorm.DB, email string) (*types.User, error) {
	var u types.User
	result := db.Where("email = ?", email).Limit(1).Find(&u)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil // nije greška, samo ne postoji
	}
	return &u, nil
}

func createUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var in types.User
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "details": err.Error()})
			return
		}

		in.Email = strings.TrimSpace(strings.ToLower(in.Email))
		if in.Email == "" || in.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}

		u := types.User{
			Email:     in.Email,
			Password:  string(hash),
			FirstName: in.FirstName,
			LastName:  in.LastName,
			Role:      types.RoleCitizen,
		}

		if err := db.WithContext(c.Request.Context()).Create(&u).Error; err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		c.JSON(http.StatusCreated, types.User{Email: u.Email})
	}
}

func login(db *gorm.DB, issuer string, secret []byte, httpClient *http.Client, mupBaseURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.LoginReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
			return
		}

		email := strings.TrimSpace(strings.ToLower(req.Email))
		password := strings.TrimSpace(req.Password)

		if email == "" || password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
			return
		}

		var finalUser *types.User
		var role types.Role

		// Step 1: try local DB
		localUser, err := getUserByEmail(db, email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		if localUser != nil {
			if err := bcrypt.CompareHashAndPassword([]byte(localUser.Password), []byte(password)); err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}
			finalUser = localUser
			role = localUser.Role

		} else {
			fmt.Printf("[AUTH] User not in local DB, calling MUP: %s\n", email)

			mupDriver, dSt, mupErr := mupGet[types.MupDriver](httpClient, mupBaseURL, "/drivers/email/"+email)
			fmt.Printf("[AUTH] MUP response — status: %d, err: %v, driver: %v\n", dSt, mupErr, mupDriver != nil)

			if mupErr != nil || dSt != http.StatusOK || mupDriver == nil {
				fmt.Printf("[AUTH] ❌ MUP lookup failed\n")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}

			if password != "123" {
				fmt.Printf("[AUTH] ❌ Password mismatch for MUP user\n")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}

			fmt.Printf("[AUTH] ✅ MUP login success: %s\n", mupDriver.Owner.Email)

			finalUser = &types.User{
				Email:     email,
				FirstName: mupDriver.Owner.FirstName,
				LastName:  mupDriver.Owner.LastName,
				Role:      types.RoleCitizen,
			}
			role = types.RoleCitizen
		}

		// Step 3: issue JWT
		now := time.Now()
		exp := now.Add(15 * time.Minute)

		claims := jwt.MapClaims{
			"sub":   finalUser.Email,
			"iss":   issuer,
			"role":  role,
			"id":    finalUser.ID,
			"email": finalUser.Email,
			"iat":   now.Unix(),
			"exp":   exp.Unix(),
		}

		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, err := tok.SignedString(secret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "signing failed"})
			return
		}

		c.JSON(http.StatusOK, types.LoginResp{
			AccessToken: signed,
			ExpiresIn:   int64(15 * 60),
			TokenType:   "Bearer",
		})
	}
}
