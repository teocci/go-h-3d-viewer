// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package renders

import "github.com/gofiber/fiber/v2"

type R map[string]any

func JSONPlainResponse[T any](c *fiber.Ctx, data T) error {
	return JSONOKResponse(c, data)
}

func JSONDataResponse[T any](c *fiber.Ctx, data T) error {
	return JSONOKResponse(c, fiber.Map{"data": data})
}

func JSONSuccessResponse(c *fiber.Ctx) error {
	return JSONOKResponse(c, fiber.Map{"success": true})
}

func JSONDataSuccessResponse[T any](c *fiber.Ctx, data T) error {
	return JSONOKResponse(c, fiber.Map{"success": true, "data": data})
}

func JSONOKResponse[T any](c *fiber.Ctx, data T) error {
	return JSONResponse(c, fiber.StatusOK, data)
}

func JSONResponse[T any](c *fiber.Ctx, code int, data T) error {
	return c.Status(code).JSON(data)
}

func JSONMapSuccessResponse(c *fiber.Ctx, raw R) error {
	data := createSuccessMap(raw)

	return JSONOKResponse(c, data)
}

func createSuccessMap(raw R) R {
	if raw == nil {
		raw = R{}
	}

	raw["success"] = true

	return raw
}
