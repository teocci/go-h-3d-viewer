// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-07
package renders

import (
	"encoding/json"
	"io"

	"github.com/gofiber/fiber/v2"
)

// StreamResponse streams large JSON responses efficiently
// This prevents loading the entire response into memory at once
// Using generics for type safety
func StreamResponse[T any](c *fiber.Ctx, payload T) error {
	// Set content type
	c.Set("Content-Type", "application/json")
	// Create a pipe for streaming
	pr, pw := io.Pipe()

	// Start a goroutine to write the response
	go func() {
		defer pw.Close()

		// Encode directly to the pipe
		encoder := json.NewEncoder(pw)
		encoder.SetEscapeHTML(false)
		if err := encoder.Encode(payload); err != nil {
			// If encoding fails, close the pipe and let the handler handle it
			pw.CloseWithError(err)
		}
	}()

	// Send the stream to the client
	return c.SendStream(pr)
}
