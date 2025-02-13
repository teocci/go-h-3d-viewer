// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-10
package endpoints

import "github.com/gofiber/fiber/v2"

func Collection(c *fiber.Ctx) error {
	gis := GISData{
		Points: []GISPoint{
			{Id: "n1", Coordinates: []int{0, 0, 0}},
			{Id: "n2", Coordinates: []int{10, 0, 0}},
			{Id: "n3", Coordinates: []int{10, 10, 0}},
			{Id: "n4", Coordinates: []int{0, 10, 0}},
			{Id: "n5", Coordinates: []int{5, 5, 10}},
		},
		Lines: []GISLine{
			{Id: "l1", Start: "n1", End: "n2"},
			{Id: "l2", Start: "n2", End: "n3"},
		},
		Polylines: []GISPolyline{
			{Id: "pl1", Nodes: []string{"n1", "n2", "n3", "n4"}},
		},
		Polygons: []GISPolygon{
			{Id: "pg1", Vertices: [][]int{{15, 0, 0}, {25, 0, 0}, {25, 10, 0}, {15, 10, 0}}},
		},
	}
	data := fiber.Map{"gis": gis}

	return c.JSON(data)
}
