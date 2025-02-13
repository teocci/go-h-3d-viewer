// Package webserver
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package webserver

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/endpoints"
)

func registerAuthEndpoints(app *fiber.App) fiber.Router {
	auth := app.Group("/auth")
	auth.Post("/:action", endpoints.HandleAuthAction)

	return auth
}
