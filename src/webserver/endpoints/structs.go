// Package endpoints
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-10
package endpoints

// GISPoint represents a single point with an ID and coordinates.
type GISPoint struct {
	Id          string `json:"id"`
	Coordinates []int  `json:"coordinates"`
}

// GISLine represents a line connecting two points by their IDs.
type GISLine struct {
	Id    string `json:"id"`
	Start string `json:"start"`
	End   string `json:"end"`
}

// GISPolyline represents a sequence of connected points (nodes).
type GISPolyline struct {
	Id    string   `json:"id"`
	Nodes []string `json:"nodes"`
}

// GISPolygon represents a closed shape defined by its vertices.
type GISPolygon struct {
	Id       string  `json:"id"`
	Vertices [][]int `json:"vertices"`
}

// GISData is the main struct that aggregates all the data types.
type GISData struct {
	Points    []GISPoint    `json:"points"`
	Lines     []GISLine     `json:"lines"`
	Polylines []GISPolyline `json:"polylines"`
	Polygons  []GISPolygon  `json:"polygons"`
}
