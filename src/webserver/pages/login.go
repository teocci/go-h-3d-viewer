// Package pages
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package pages

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

func handleLoginPage(c *fiber.Ctx, page renders.PageInfo) error {
	return renders.HTMLPage(c, page)
}
