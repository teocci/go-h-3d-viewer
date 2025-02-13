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
