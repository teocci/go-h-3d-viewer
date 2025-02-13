// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import (
	"log"
	"sync"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Singleton pattern for database connection
var (
	dbInstance *gorm.DB
	once       sync.Once
)

// GetDB returns a singleton instance of the database.
func GetDB() *gorm.DB {
	once.Do(func() {
		var err error
		dbInstance, err = gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		// Auto-migrate models
		err = dbInstance.AutoMigrate(&User{}, &Provider{}, &UserProvider{})
		if err != nil {
			log.Fatal("Failed to migrate database:", err)
		}

		// Load initial users if none exist
		seedUsers(dbInstance)
	})
	return dbInstance
}

// InitDB initializes the SQLite database and creates predefined users if necessary.
func InitDB(dbPath string) *gorm.DB {
	// Open the SQLite database
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	// Auto-migrate the schema
	err = db.AutoMigrate(&User{}, &Provider{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}
