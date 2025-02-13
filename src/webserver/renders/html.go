// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package renders

import (
	"github.com/gofiber/fiber/v2"
)

// HTMLPage renders the specified page using the main.tmp layout.
func HTMLPage(c *fiber.Ctx, page PageInfo) error {
	// Load the main template
	return c.Render(page.Name, fiber.Map{
		"page": page,
	})
}
