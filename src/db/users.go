// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import (
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the database.
type User struct {
	gorm.Model
	UUID         string `gorm:"type:char(36);primaryKey;unique;not null"`
	Name         string `gorm:"not null"`
	Username     string `gorm:"unique;not null"`
	PasswordHash string `gorm:"not null"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	u.UUID = uuid.New().String()
	return
}

func (u *User) CheckPasswordHash(hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(u.PasswordHash))
	return err == nil
}
