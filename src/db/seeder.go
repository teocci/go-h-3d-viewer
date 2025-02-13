// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import (
	"encoding/json"
	"log"
	"os"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserJSON represents the user structure in the JSON file.
type UserJSON struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"` // Plain-text in JSON, but will be hashed before storing
}

// seedUsers loads users from `users.json` if none exist in the database.
func seedUsers(db *gorm.DB) {
	var count int64
	db.Model(&User{}).Count(&count)
	if count > 0 {
		log.Println("Users already exist. Skipping user initialization.")
		return
	}

	// Read users from `users.json`
	file, err := os.ReadFile("users.json")
	if err != nil {
		log.Fatal("Failed to read users.json:", err)
	}

	var users []UserJSON
	err = json.Unmarshal(file, &users)
	if err != nil {
		log.Fatal("Failed to parse users.json:", err)
	}

	// Insert users into database
	for _, u := range users {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash password for user:", u.Username)
		}

		user := User{
			UUID:         uuid.New().String(),
			Name:         u.Name,
			Username:     u.Username,
			PasswordHash: string(hashedPassword),
		}

		if err := db.Create(&user).Error; err != nil {
			log.Println("Skipping user (duplicate username?):", u.Username, err)
		} else {
			log.Println("User added:", u.Username)
		}
	}
}
