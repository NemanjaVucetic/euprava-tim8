package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	ServiceHost string
	ServicePort int64
	DBHost      string
	DBPort      int
	DBUser      string
	DBPass      string
	DBName      string
}

func GetConfig() Config {
	port, err := strconv.ParseInt(os.Getenv("SERVICE_PORT"), 10, 64)
	if err != nil {
		panic(fmt.Sprintf("Couldn't parse service port: %v", err))
	}

	return Config{
		DBHost:      os.Getenv("DB_HOST"),
		DBUser:      os.Getenv("DB_USER"),
		DBPass:      os.Getenv("DB_PASS"),
		DBName:      os.Getenv("DB_NAME"),
		ServiceHost: os.Getenv("SERVICE_HOST"),
		ServicePort: port,
	}
}
