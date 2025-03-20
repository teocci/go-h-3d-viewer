// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-10
package endpoints

import (
	"encoding/json"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/parsers"

	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

const dummyCollectionsDataPath = "./web/json/updated-collections.json"

type GISCollection struct {
	Name string   `json:"name"`
	UUID string   `json:"uuid"`
	GIS  *GISData `json:"gis,omitempty"`
}

type GISCollections []GISCollection

func CollectionList(c *fiber.Ctx) error {
	// Load dummy from the JSON file
	dummy, err := loadCollectionsFromFile(dummyCollectionsDataPath)
	if err != nil {
		return renders.JSONBadRequest(c, ErrFailedToLoadCollections)
	}

	var collections GISCollections
	for _, raw := range dummy {
		item := GISCollection{raw.Name, raw.UUID, nil}
		collections = append(collections, item)
	}

	return renders.JSONOKResponse(c, collections)
}

func Collections(c *fiber.Ctx) error {
	uuids, err := parsers.QueryCollectionUUIDs(c)
	if err != nil {
		return renders.JSONBadRequest(c, err)
	}

	// Ensure at least one UUID is provided
	if len(uuids) == 0 {
		return renders.JSONBadRequest(c, ErrAtLeastOneUUIDRequired)
	}

	// Load dummy from the JSON file
	dummy, err := loadCollectionsFromFile(dummyCollectionsDataPath)
	if err != nil {
		return renders.JSONBadRequest(c, ErrFailedToLoadCollections)
	}

	// Filter dummy based on requested UUIDs
	var collections GISCollections
	for _, coll := range dummy {
		if contains(uuids, coll.UUID) {
			collections = append(collections, coll)
		}
	}

	return renders.JSONOKResponse(c, collections)
}

func loadCollectionsFromFile(filePath string) (GISCollections, error) {
	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// Parse JSON data
	var collections GISCollections
	if err := json.Unmarshal(data, &collections); err != nil {
		return nil, err
	}

	return collections, nil
}

func contains(list []string, item string) bool {
	for _, v := range list {
		if v == item {
			return true
		}
	}
	return false
}
