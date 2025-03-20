// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2024-9월-04
package gisapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

var (
	ErrResponseNotDefined = errors.New("error response was not defined")
	ErrAPIResponseIsNil   = errors.New("API response is nil")
	ErrMissingDataField   = errors.New("response is missing the 'Data' field")
	ErrInvalidUUID        = errors.New("invalid network UUID")
)

// APIError represents an error response from the API
type APIError struct {
	Timestamp time.Time `json:"timestamp"`
	Status    int       `json:"status"`
	Error     string    `json:"error"`
	Path      string    `json:"path"`
}

func (ae *APIError) decode(r *http.Response) error {
	if r == nil {
		return ErrResponseNotDefined
	}

	err := json.NewDecoder(r.Body).Decode(ae)
	if err != nil {
		return fmt.Errorf("status code: %d, failed to decode error body: %w", r.StatusCode, err)
	}

	return fmt.Errorf("status code: %d, path: '%s' - %s", ae.Status, ae.Path, ae.Error)
}

func ErrorDecodingBody(err error) error {
	return fmt.Errorf("failed to decode response body: %w", err)
}

func ErrorAPIResponseFailure(c ResponseCode) error {
	return fmt.Errorf("API returned failure status[%d]: %s", c, c.AsString())
}
