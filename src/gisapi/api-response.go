// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-07
package gisapi

import (
	"encoding/json"
	"net/http"
)

// APIResponse is the base response structure.
type APIResponse[T any] struct {
	RequestId       string `json:"requestId"`
	ResponseCode    `json:"responseCode"`
	ResponseMessage string `json:"responseMessage"`
	Data            *T     `json:"data"`
}

func (ar *APIResponse[T]) decode(r *http.Response) error {
	if r == nil {
		return ErrAPIResponseIsNil
	}

	if r.StatusCode != http.StatusOK {
		var apiErr APIError
		return apiErr.decode(r)
	}

	if err := json.NewDecoder(r.Body).Decode(ar); err != nil {
		return ErrorDecodingBody(err)
	}

	if ar.ResponseCode != ResponseCodeSuccess {
		return ErrorAPIResponseFailure(ar.ResponseCode)
	}

	if ar.Data == nil {
		return ErrMissingDataField
	}

	return nil
}

// fetchGet performs an HTTP GET request to the given URL and decodes the response
// into the APIResponse. It uses the helper apiGetRequest (which you can adjust as needed).
func (ar *APIResponse[T]) fetch(url string) error {
	res, err := apiGetRequest[APIResponse[T]](url)
	if err != nil {
		return err
	}

	*ar = *res

	return nil
}

// fetchPost performs an HTTP POST request with the given payload to the given URL and decodes the response
// into the APIResponse. It uses the helper apiPostRequest (which you can adjust as needed).
func (ar *APIResponse[T]) fetchPost(url string, payload any) error {
	res, err := apiPostRequest[APIResponse[T], any](url, &payload)
	if err != nil {
		return err
	}

	*ar = *res

	return nil
}
