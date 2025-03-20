// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-06
package endpoints

import (
	"github.com/gofiber/fiber/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/gisapi"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

const (
	NetworkKindNodes = "nodes"
	NetworkKindLinks = "links"
)

func NetworkHandler(c *fiber.Ctx) error {
	kind := c.Params("kind")
	if kind == "" {
		return renders.JSONBadRequest(c, ErrKindRequired)
	}
	
	switch kind {
	case NetworkKindNodes:
		return NetworkNodes(c)
	case NetworkKindLinks:
		return NetworkLinks(c)
	}

	return renders.JSONBadRequest(c, ErrKindNotSupported)
}

func NetworkNodes(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		return renders.JSONBadRequest(c, ErrUUIDRequired)
	}

	list := &gisapi.NodesData{}
	if err := list.ByNetworkUUID(uuid); err != nil {
		return renders.JSONInternalError(c, err)
	}

	return renders.StreamResponse(c, renders.R{"uuid": uuid, "data": list})
}

func NetworkLinks(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		return renders.JSONBadRequest(c, ErrUUIDRequired)
	}

	list := &gisapi.LinksData{}
	if err := list.ByNetworkUUID(uuid); err != nil {
		return renders.JSONInternalError(c, err)
	}

	return renders.StreamResponse(c, renders.R{"uuid": uuid, "data": list})
}
