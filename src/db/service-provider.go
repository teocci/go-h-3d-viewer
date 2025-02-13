// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import (
	"log"
)

// RegisterNewProvider creates a new provider entry.
func RegisterNewProvider(host string, port int, dbUser, dbPassword string) (Provider, error) {
	db := GetDB()
	provider := Provider{
		Host:       host,
		Port:       port,
		DBUser:     dbUser,
		DBPassword: dbPassword,
	}
	if err := db.Create(&provider).Error; err != nil {
		return Provider{}, err
	}

	log.Println("New provider registered:", provider.UUID)
	return provider, nil
}

// GetProviderDetails fetches details of a provider by UUID.
func GetProviderDetails(providerUUID string) (Provider, error) {
	db := GetDB()
	var provider Provider
	if err := db.Where("uuid = ?", providerUUID).First(&provider).Error; err != nil {
		return Provider{}, err
	}
	return provider, nil
}
