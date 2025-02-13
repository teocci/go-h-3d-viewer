// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package endpoints

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"golang.org/x/crypto/bcrypt"

	"github.com/teocci/go-hynix-3d-viewer/src/db"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

// JWT Secret Key (should be stored in an environment variable or config file)
var jwtSecret = []byte("super-secret-key")

// LoginRequest represents the expected login request body
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// HandleAuthAction processes login and logout actions.
func HandleAuthAction(c *fiber.Ctx) error {
	action := c.Params("action")

	switch action {
	case "login":
		return handleLogin(c)
	case "logout":
		return handleLogout(c)
	default:
		return renders.JSONBadRequest(c, ErrInvalidAuthAction)
	}
}

// handleLogin authenticates the user and stores JWT in an HTTP-only cookie.
func handleLogin(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return renders.JSONBadRequest(c, ErrInvalidPayload)
	}

	// Validate input
	if req.Username == "" || req.Password == "" {
		return renders.JSONBadRequest(c, ErrMissingCredentials)
	}

	// Retrieve user from the database
	dbInstance := db.GetDB()
	var user db.User
	err := dbInstance.Where("username = ?", req.Username).First(&user).Error
	if err != nil {
		return renders.JSONUnauthorized(c, ErrInvalidCredentials)
	}

	// Validate password
	if !checkPassword(req.Password, user.PasswordHash) {
		return renders.JSONUnauthorized(c, ErrInvalidCredentials)
	}

	// Generate JWT token with a 1-year expiration
	token, err := generateJWT(user.UUID)
	if err != nil {
		log.Println("Error generating JWT:", err)
		return renders.JSONInternalError(c, ErrTokenGeneration)
	}

	// Store JWT in an HTTP-only secure cookie
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    token,
		Expires:  time.Now().Add(365 * 24 * time.Hour), // 1 year expiration
		HTTPOnly: true,                                 // Prevents JavaScript access (XSS protection)
		Secure:   true,                                 // Requires HTTPS (enable in production)
		SameSite: "Strict",
	})

	return c.JSON(fiber.Map{"message": "Login successful"})
}

// handleLogout clears the JWT cookie.
func handleLogout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour), // Expire immediately
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// checkPassword compares the hashed password from the database with the provided password.
func checkPassword(password, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

// generateJWT creates a JWT token with user UUID and 1-year expiration.
func generateJWT(userUUID string) (string, error) {
	claims := jwt.MapClaims{
		"uuid": userUUID,
		"exp":  time.Now().Add(365 * 24 * time.Hour).Unix(), // Token expires in 1 year
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}
