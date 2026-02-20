package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	ServiceHost  string
	ServicePort  int64
	DBHost       string
	DBPort       int
	DBUser       string
	DBPass       string
	DBName       string
	MupBaseURL   string
	MupTimeoutMs int
}

func GetConfig() Config {
	port, err := strconv.ParseInt(os.Getenv("SERVICE_PORT"), 10, 64)
	if err != nil {
		panic(fmt.Sprintf("Couldn't parse service port: %v", err))
	}

	mup := os.Getenv("MUP_BASE_URL")
	if mup == "" {
		mup = "http://mup-vehicles-service:8081"
	}

	timeoutMs := 3000
	if v := os.Getenv("MUP_TIMEOUT_MS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			timeoutMs = n
		}
	}

	return Config{
		DBHost:       os.Getenv("DB_HOST"),
		DBUser:       os.Getenv("DB_USER"),
		DBPass:       os.Getenv("DB_PASS"),
		DBName:       os.Getenv("DB_NAME"),
		ServiceHost:  os.Getenv("SERVICE_HOST"),
		ServicePort:  port,
		MupBaseURL:   mup,
		MupTimeoutMs: timeoutMs,
	}
}
