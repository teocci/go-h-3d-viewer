// Package pages
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package pages

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/parsers"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

func handleNetworkViewer(c *fiber.Ctx, page renders.PageInfo) error {
	network, err := parsers.QueryNetwork(c)
	if err != nil {
		return renders.HTMLBadRequestWithError(c, err)
	}

	page.SetParam("viewer", "network")
	page.SetParam("network", network)

	// Render the Viewer page
	return renders.HTMLPage(c, page)
}

func handleProviderViewer(c *fiber.Ctx, page renders.PageInfo) error {
	provider, err := parsers.QueryProvider(c)
	if err != nil {
		return renders.HTMLBadRequestWithError(c, err)
	}

	collections, err := parsers.QueryCollectionUUIDs(c)
	if err != nil {
		return renders.HTMLBadRequestWithError(c, err)
	}

	// Ensure at least one valid UUID exists
	if len(collections) == 0 {
		return renders.HTMLBadRequestWithError(c, ErrAtLeastOneUUIDRequired)
	}

	page.SetParam("viewer", "collections")
	page.SetParam("provider", provider)
	page.SetParam("collections", collections)

	// Render the Viewer page
	return renders.HTMLPage(c, page)
}

func handleViewerPage(c *fiber.Ctx, page renders.PageInfo) error {
	if parsers.QueryHasKeys(c, "network") {
		return handleNetworkViewer(c, page)
	}

	if parsers.QueryHasKeys(c, "provider", "collections") {
		return handleProviderViewer(c, page)
	}

	return renders.HTMLBadRequestWithError(c, ErrNetworkOrProviderRequired)
}
