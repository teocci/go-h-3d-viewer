// Package pages
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package pages

import "errors"

var (
	ErrAtLeastOneUUIDRequired    = errors.New("at least one valid UUID is required")
	ErrNetworkOrProviderRequired = errors.New("invalid viewer parameters, must specify either network" +
		" or provider with collections")
)
