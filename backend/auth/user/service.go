package user

import (
	"auth/types"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func getUserByEmailAndPassword(db *gorm.DB, email string) (types.User, error) {
	var u types.User
	if err := db.Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return types.User{}, errors.New("user not found")
		}
		return types.User{}, err
	}
	return u, nil
}

func createUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var in types.User
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid payload",
				"details": err.Error(),
			})
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
			Role:      "STUDENT",
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

		c.JSON(http.StatusCreated, types.User{
			ID:    u.ID,
			Email: u.Email,
		})
	}
}

func login(db *gorm.DB, issuer string, secret []byte) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.LoginReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
			return
		}

		email := strings.TrimSpace(req.Email)
		if email == "" {
			email = strings.TrimSpace(req.Email)
		}
		if email == "" || strings.TrimSpace(req.Password) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email/username and password are required"})
			return
		}

		u, err := getUserByEmailAndPassword(db, email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		now := time.Now()
		exp := now.Add(15 * time.Minute)

		claims := jwt.MapClaims{
			"sub":  u.Email,
			"iss":  issuer,
			"role": u.Role,
			"id":   u.ID,
			"iat":  now.Unix(),
			"exp":  exp.Unix(),
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
