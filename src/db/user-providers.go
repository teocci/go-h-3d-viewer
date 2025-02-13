// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import "gorm.io/gorm"

// UserProvider represents the many-to-many relationship between users and providers.
type UserProvider struct {
	gorm.Model
	UserUUID     string `gorm:"type:char(36);not null;index"`
	ProviderUUID string `gorm:"type:char(36);not null;index"`
	
	User     `gorm:"foreignKey:UserUUID;references:UUID;index"`
	Provider `gorm:"foreignKey:ProviderUUID;references:UUID;index"`
}
