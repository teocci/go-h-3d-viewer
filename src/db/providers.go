// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Provider struct {
	gorm.Model
	UUID       string `gorm:"type:char(36);primaryKey;unique;not null"`
	Host       string `gorm:"type:varchar(255);not null"`
	Port       int    `gorm:"type:integer;not null"`
	DBUser     string `gorm:"type:varchar(255);not null"`
	DBPassword string `gorm:"type:varchar(255);not null"`
}

// BeforeCreate hook to generate UUID
func (p *Provider) BeforeCreate(tx *gorm.DB) (err error) {
	p.UUID = uuid.New().String()
	return
}
