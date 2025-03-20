// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-06
package gisapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const formatAPIKeyTag = "ApiKey"

func fetchApiKey() (string, error) {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("'API_KEY' is not set")
	}

	return apiKey, nil
}

func initAuthHeaders() (map[string]string, error) {
	apiKey, err := fetchApiKey()
	if err != nil {
		return nil, err
	}

	return map[string]string{
		formatAPIKeyTag: apiKey,
	}, nil
}

func apiDecoder[T any](r *http.Response) (*T, error) {
	result := new(T)
	if err := json.NewDecoder(r.Body).Decode(result); err != nil {
		return nil, err
	}
	return result, nil
}

func createRequest(method, url string, headers map[string]string, payload any) (*http.Request, error) {
	if (method == "POST" || method == "PUT" || method == "PATCH") && payload == nil {
		return nil, fmt.Errorf("method %s requires a non-nil body", method)
	}

	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	// Set default headers
	req.Header.Set("Accept", "application/json")
	if payload != nil {
		req.Header.Set("Content-Type", "application/json; charset=UTF-8")
	}

	// Add any additional headers
	if headers != nil {
		for key, value := range headers {
			req.Header.Set(key, value)
		}
	}

	return req, nil
}

// requester sends an HTTP request using the given method, URL, payload, and extra headers.
// It automatically adds the default ApiKey and Content-Type headers.
func requester(method, url string, headers map[string]string, payload any) (*http.Response, error) {
	req, err := createRequest(method, url, headers, payload)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	return client.Do(req)
}

func apiRequestWithHeaders[T any, P any](method, url string, extraHeader map[string]string, payload *P) (*T, error) {
	headers, err := initAuthHeaders()
	if err != nil {
		return nil, err
	}

	if extraHeader != nil {
		for key, value := range extraHeader {
			headers[key] = value
		}
	}

	resp, err := requester(method, url, headers, payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("request failed with status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return apiDecoder[T](resp)
}

// apiRequest is a generic function that sends an HTTP request with the given method and payload,
// and decodes the JSON response into a newly allocated variable of type T.
func apiRequest[T any, P any](method, url string, payload *P) (*T, error) {
	return apiRequestWithHeaders[T](method, url, nil, payload)
}

// apiGetRequest is a convenience function for GET requests using generics.
// Since GET requests do not have a payload, we pass nil.
func apiGetRequest[T any](url string) (*T, error) {
	return apiRequest[T, any]("GET", url, nil)
}

// apiPostRequest is a convenience function for POST requests using generics.
func apiPostRequest[T any, P any](url string, payload *P) (*T, error) {
	return apiRequest[T, P]("POST", url, payload)
}
