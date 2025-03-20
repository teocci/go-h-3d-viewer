// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-06
package gisapi

import (
	"fmt"

	"github.com/teocci/go-hynix-3d-viewer/src/config"
)

const (
	formatAddress = "%s:%d"
	formatURL     = "%s://%s"
	formatAPI     = "%s/api/v2"
)

var (
	profile *config.ProfileData
	apiURL  string
)

func InitVars(config *config.ProfileData) {
	// Initialize variables here.
	profile = config
	fmt.Printf("InitVars: %v\n", profile)

	InitAPIConfig()
}

func InitAPIConfig() {
	apiProtocol := profile.API.Protocol
	apiHost := profile.API.Host
	apiPort := profile.API.Port
	apiBaseURL := baseAPIURL(apiProtocol, apiHost, apiPort)
	apiURL = fmt.Sprintf(formatAPI, apiBaseURL)
}

func baseAPIAddress(host string, port int) string {
	return fmt.Sprintf(formatAddress, host, port)
}

func baseAPIURL(protocol, host string, port int) string {
	address := baseAPIAddress(host, port)
	if protocol == "" {
		protocol = "http"
	}

	return fmt.Sprintf(formatURL, protocol, address)
}
