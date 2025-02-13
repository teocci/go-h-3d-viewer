// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import "log"

// GetProvidersByUserUUID retrieves all providers linked to a given user.
func GetProvidersByUserUUID(userUUID string) ([]Provider, error) {
	db := GetDB()
	var providers []Provider

	// Get associated provider UUIDs
	var userProviders []UserProvider
	if err := db.Where("user_uuid = ?", userUUID).Find(&userProviders).Error; err != nil {
		return nil, err
	}

	// Extract provider UUIDs
	providerUUIDs := make([]string, len(userProviders))
	for i, up := range userProviders {
		providerUUIDs[i] = up.ProviderUUID
	}

	// Get provider details
	if err := db.Where("uuid IN ?", providerUUIDs).Find(&providers).Error; err != nil {
		return nil, err
	}

	return providers, nil
}

// LinkProviderWithUser links a provider to a user.
func LinkProviderWithUser(userUUID, providerUUID string) error {
	db := GetDB()

	// Check if link already exists
	var existing UserProvider
	if err := db.Where("user_uuid = ? AND provider_uuid = ?", userUUID, providerUUID).First(&existing).Error; err == nil {
		return ErrProviderAlreadyLinked
	}

	userProvider := UserProvider{
		UserUUID:     userUUID,
		ProviderUUID: providerUUID,
	}

	if err := db.Create(&userProvider).Error; err != nil {
		return err
	}

	log.Println("Linked user", userUUID, "to provider", providerUUID)
	return nil
}
