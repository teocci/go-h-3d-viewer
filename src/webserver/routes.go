// Package webserver
// Created by RTT.
// Author: teocci@yandex.com on 2025-1월-15
package webserver

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/endpoints"
)

func registerAPIEndpoints(app *fiber.App) fiber.Router {
	// Create an API route group.
	api := app.Group("/api/v1")
	api.Get("/collections/list", endpoints.CollectionList)
	api.Get("/collections", endpoints.Collections)
	api.Get("/collection", endpoints.Collection)

	api.Get("/network/:uuid/:kind", endpoints.NetworkHandler)

	return api
}
