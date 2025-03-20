// Package config
// Created by RTT.
// Author: teocci@yandex.com on 2025-03월-07
package config

import (
	"log"
	"os"
)

// ActiveProfileName returns the name of the active profile from environment variables or config.json.
// It defaults to "prod" if no profile is set.
func ActiveProfileName() string {
	// Check if APP_PROFILE is set in the environment
	profileName := os.Getenv("APP_PROFILE")
	if profileName == "" {
		// If not set, check the profile from config.json
		profileName = Profile
	}

	// Default to "prod" if no profile is provided
	if profileName == "" {
		profileName = "prod"
	}

	return profileName
}

// ActiveProfile returns the active profile configuration.
func ActiveProfile() *ProfileData {
	cfg := Get()
	if cfg == nil {
		log.Fatalf("Configuration not found")
	}
	if cfg.Profiles == nil {
		log.Fatalf("Profiles not found in configuration")
	}
	if cfg.Profile == "" {
		log.Fatalf("Active profile not found in configuration")
	}

	// Retrieve the profile configuration based on the profile name
	profile, ok := cfg.Profiles[cfg.Profile]
	if !ok {
		log.Fatalf("Profile %s not found in configuration", cfg.Profile)
	}

	return &profile
}
