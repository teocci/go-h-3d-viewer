// Package pages
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package pages

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/parsers"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

func handleViewerPage(c *fiber.Ctx, page renders.PageInfo) error {
	provider, err := parsers.QueryProvider(c)
	if err != nil {
		return renders.HTMLBadRequestWithError(c, err)
	}

	collections, err := parsers.CollectionUUIDs(c)
	if err != nil {
		return renders.HTMLBadRequestWithError(c, err)
	}

	// Ensure at least one valid UUID exists
	if len(collections) == 0 {
		return renders.HTMLBadRequestWithError(c, ErrAtLeastOneUUIDRequired)
	}

	page.SetParam("provider", provider)
	page.SetParam("collections", collections)

	// Render the Viewer page
	return renders.HTMLPage(c, page)
}
