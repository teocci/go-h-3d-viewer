// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-07
package gisapi

import "fmt"

type GeometryListRequest struct {
	UUID string `json:"requestId"`
}

const (
	formatNetworkNode = "%s/network/node-geometry"
	formatNetworkLink = "%s/network/link-geometry"
)

func (n *NodesData) ByNetworkUUID(uuid string) error {
	if uuid == "" {
		return ErrInvalidUUID
	}

	url := fmt.Sprintf(formatNetworkNode, apiURL)

	fmt.Printf("URL: %s\n", url)

	payload := GeometryListRequest{
		UUID: uuid,
	}

	res := NodeListResponse{}
	err := res.fetchPost(url, payload)
	if err != nil {
		return err
	}

	*n = *res.Data

	return nil
}

func (l *LinksData) ByNetworkUUID(uuid string) error {
	if uuid == "" {
		return ErrInvalidUUID
	}

	url := fmt.Sprintf(formatNetworkLink, apiURL)

	fmt.Printf("URL: %s\n", url)

	payload := GeometryListRequest{
		UUID: uuid,
	}

	res := LinkListResponse{}
	err := res.fetchPost(url, payload)
	if err != nil {
		return err
	}

	*l = *res.Data

	return nil
}
