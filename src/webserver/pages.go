// Package webserver
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package webserver

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/pages"
)

func registerPages(app *fiber.App) {
	// Serve static files (CSS, JS, images, etc.)
	app.Static("/", "./web")

	page := app.Group("/page")
	page.Get("/:page", pages.HandlePages)
}
