// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-06
package gisapi

type NodeGeometry struct {
	ID       int       `json:"id"`
	Guid     string    `json:"guid"`
	Type     int       `json:"type"`
	Geometry []float64 `json:"geometry"`
}

type LinkGeometry struct {
	ID          int         `json:"id"`
	Guid        string      `json:"guid"`
	SequenceNo  int         `json:"sequenceNo"`
	StartNodeId int         `json:"startNodeId"`
	EndNodeId   int         `json:"endNodeId"`
	Type        int         `json:"type"`
	Geometry    [][]float64 `json:"geometry"`
}

type NodesData []NodeGeometry
type LinksData []LinkGeometry

type NodeListResponse struct {
	APIResponse[NodesData]
}

type LinkListResponse struct {
	APIResponse[LinksData]
}
