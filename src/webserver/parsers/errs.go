// Package parsers
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package parsers

import "errors"

var (
	ErrCollectionsRequired = errors.New("collections UUIDs are required")
	ErrProviderRequired    = errors.New("provider UUID is required")
)
