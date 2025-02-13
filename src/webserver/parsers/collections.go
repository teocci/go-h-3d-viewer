// Package parsers
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package parsers

import (
	"github.com/gofiber/fiber/v2"
)

func CollectionUUIDs(c *fiber.Ctx) ([]string, error) {
	uuids := c.Query("collections")
	if uuids == "" {
		return nil, ErrCollectionsRequired
	}

	// Convert comma-separated UUIDs into a slice
	collections := SplitAndTrim(uuids, ",")

	return collections, nil
}
