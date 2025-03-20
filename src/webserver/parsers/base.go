// Package parsers
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package parsers

import (
	"github.com/gofiber/fiber/v2"
)

func QueryProvider(c *fiber.Ctx) (string, error) {
	if provider, ok := queryString(c, "provider"); ok {
		return provider, nil
	}

	return "", ErrProviderRequired
}

func QueryNetwork(c *fiber.Ctx) (string, error) {
	if network, ok := queryString(c, "network"); ok {
		return network, nil
	}

	return "", ErrNetworkRequired
}

// QueryHasKeys checks if all the specified keys exist in the request's query parameters.
// Returns true only if all keys are present.
func QueryHasKeys(c *fiber.Ctx, keys ...string) bool {
	queries := c.Queries()

	for _, key := range keys {
		_, exists := queries[key]
		if !exists {
			return false
		}
	}

	return true
}
