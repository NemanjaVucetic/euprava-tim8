package user

import (
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func WithUserAPI(r *gin.RouterGroup, db *gorm.DB) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	issuer := os.Getenv("ISSUER")

	r.POST("/users", createUser(db))
	r.POST("/login", login(db, issuer, secret))
}
