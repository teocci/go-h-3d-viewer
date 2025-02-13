// Package parsers
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package parsers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func queryString(c *fiber.Ctx, key string) (string, bool) {
	param := strings.TrimSpace(c.Query(key))
	if param == "" {
		return "", false
	}

	return param, true
}

// SplitAndTrim splits a comma-separated string and trims spaces.
func SplitAndTrim(input string, sep string) []string {
	parts := strings.Split(input, sep)
	var result []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
