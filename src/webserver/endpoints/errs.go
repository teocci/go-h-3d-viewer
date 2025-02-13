// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package endpoints

import "errors"

var (
	ErrNotFound                = errors.New("not found")
	ErrExists                  = errors.New("already exists")
	ErrInvalidAuthAction       = errors.New("invalid authentication action")
	ErrInvalidPayload          = errors.New("invalid request payload")
	ErrMissingCredentials      = errors.New("username and password are required")
	ErrInvalidCredentials      = errors.New("invalid username or password")
	ErrTokenGeneration         = errors.New("could not generate token")
	ErrInvalidToken            = errors.New("invalid token")
	ErrTokenExpired            = errors.New("token expired")
	ErrTokenMissing            = errors.New("token missing")
	ErrInvalidJSONFormat       = errors.New("invalid JSON format")
	ErrAtLeastOneUUIDRequired  = errors.New("at least one UUID is required")
	ErrFailedToParseUUID       = errors.New("failed to parse UUID")
	ErrFailedToLoadPayload     = errors.New("failed to load collections data")
	ErrFailedToLoadCollections = errors.New("failed to load collections")
)
