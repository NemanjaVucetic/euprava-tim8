package user

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func WithUserAPI(r *gin.RouterGroup, db *gorm.DB) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	issuer := os.Getenv("ISSUER")
	mupBaseURL := "http://mup-vehicles-service:8080"

	httpClient := &http.Client{Timeout: 3 * time.Second}

	r.POST("/users", createUser(db))
	r.POST("/login", login(db, issuer, secret, httpClient, mupBaseURL))
}
