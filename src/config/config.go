// Package config
// Created by RTT.
// Author: teocci@yandex.com on 2025-1월-14
package config

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/teocci/go-hynix-3d-viewer/src/env"
)

type APIServer struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Protocol string `json:"protocol,omitempty"`
}

type WebServer struct {
	Port int `json:"port"`
}

type ProfileData struct {
	API APIServer `json:"endpoints"`
}

type ServerSetup struct {
	Web      WebServer              `json:"web"`
	Profile  string                 `json:"profile"`
	Profiles map[string]ProfileData `json:"profiles"`
	Config   string                 `json:"-"`
}

const (
	defaultConfigPath = "./config.json"
	defaultProfile    = "prod"
	defaultWebPort    = 3090
)

var (
	configInstance *ServerSetup
	once           sync.Once
	mutex          sync.RWMutex

	Config  string
	Profile string
	Port    int
)

// AddFlags sets up the command-line flags.
// Here we set a default for the config file but not for port/profile.
func AddFlags(cmd *cobra.Command) {
	cmd.Flags().StringVarP(&Config, "config", "c", defaultConfigPath, "Path to the configuration file")
	// For profile, use an empty default so that if the user does not supply one,
	// the value from config.json (or env) remains.
	cmd.Flags().StringVarP(&Profile, "profile", "r", "", "Configuration profile (overrides config file and .env)")
	// For port, use 0 as the default so the [config.json] value isn’t overwritten.
	cmd.Flags().IntVarP(&Port, "port", "p", 0, "Override the web server port (overrides config file and .env)")
}

// LoadConfigFile loads the configuration from a specified file
func LoadConfigFile(file string) error {
	// Load environment variables from the .env file.
	if err := env.Load(); err != nil {
		log.Printf("No .env file found or error loading .env: %v", err)
	}

	v := viper.New()
	v.SetConfigFile(file)
	v.SetConfigType("json")

	// Set default values
	v.SetDefault("profile", defaultProfile)

	// Read in the configuration file
	if err := v.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	v.AutomaticEnv()
	// Replace dots with underscores so that "web.port" can come from WEB_PORT.
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	_ = v.BindEnv("profile", "PROFILE")
	_ = v.BindEnv("web.port", "WEB_SERVER_PORT")

	log.Printf("Profile-aa: %v\n", v.Get("profile"))
	log.Printf("Web Port-aa: %v\n", v.Get("web.port"))

	// Read in the configuration file.
	if err := v.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	// Unmarshal into ServerSetup struct
	var config ServerSetup
	if err := v.Unmarshal(&config); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	log.Printf("Config: %v\n", config)

	// Lock and update the global config instance
	mutex.Lock()
	defer mutex.Unlock()

	configInstance = &config

	log.Printf("Instance: %v\n", configInstance)

	return nil
}

// mergeProfile merges the profile-specific settings from the "profiles" map
// into the top-level configuration.
func mergeProfile() error {
	mutex.Lock()
	defer mutex.Unlock()

	if configInstance == nil {
		return errors.New("config instance is nil")
	}

	// Determine the selected profile.
	// CLI flag (global variable Profile) overrides what was loaded in configInstance.
	selectedProfile := Profile
	if selectedProfile == "" {
		selectedProfile = configInstance.Profile
	}
	if selectedProfile == "" {
		selectedProfile = defaultProfile
	}

	// Merge profile-specific settings.
	configInstance.Profile = selectedProfile

	return nil
}

func Load() error {
	if Config == "" {
		return errors.New("no configuration file specified")
	}

	if configInstance != nil && Config == defaultConfigPath {
		return nil
	}

	if err := LoadConfigFile(Config); err != nil {
		return fmt.Errorf("failed to load configuration file: %w", err)
	}

	if err := mergeProfile(); err != nil {
		return fmt.Errorf("failed to merge profile settings: %w", err)
	}

	// Apply CLI flag overrides (ONLY if set explicitly).
	if Port != 0 {
		mutex.Lock()
		configInstance.Web.Port = Port
		mutex.Unlock()
	}
	// If a CLI profile flag was provided, re-merge using that profile.
	if Profile != "" {
		mutex.Lock()
		configInstance.Profile = Profile
		mutex.Unlock()
		if err := mergeProfile(); err != nil {
			return fmt.Errorf("failed to re-merge profile settings after CLI profile override: %w", err)
		}
	}

	return nil
}

// Fetch retrieves the configuration, loading it if necessary
func Fetch() (*ServerSetup, error) {
	var err error
	once.Do(func() {
		err = Load()
	})

	return configInstance, err
}

// Watch watches the config file for changes and reloads it dynamically
func Watch() {
	v := viper.New()
	v.SetConfigFile(Config)
	v.SetConfigType("json")

	// Load environment variables.
	if err := env.Load(); err != nil {
		log.Printf("No .env file found or error loading .env: %v", err)
	}

	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	_ = v.BindEnv("profile", "PROFILE")
	_ = v.BindEnv("web.port", "WEB_SERVER_PORT")

	// Watch for changes
	v.WatchConfig()
	v.OnConfigChange(func(e fsnotify.Event) {
		log.Printf("Config file changed: %s", e.Name)
		if err := Load(); err != nil {
			log.Printf("Failed to reload configuration: %v", err)
		} else {
			log.Println("Configuration successfully reloaded")
		}
	})

	// Load initial config
	if err := Load(); err != nil {
		log.Printf("Error reading initial config: %v", err)
	}
}

// Get safely retrieves the current configuration instance
func Get() *ServerSetup {
	mutex.RLock()
	defer mutex.RUnlock()

	return configInstance
}
