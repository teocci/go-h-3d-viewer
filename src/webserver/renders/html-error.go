// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package renders

import "github.com/gofiber/fiber/v2"

func HTMLError(c *fiber.Ctx, code int, message string) error {
	return c.Status(code).SendString(message)
}

func HTMLNotFound(c *fiber.Ctx) error {
	return HTMLNotFoundWithMessage(c, "Page not found")
}

func HTMLNotFoundWithError(c *fiber.Ctx, err error) error {
	return HTMLNotFoundWithMessage(c, err.Error())
}

func HTMLNotFoundWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusNotFound, message)
}

func HTMLServerError(c *fiber.Ctx) error {
	return HTMLServerErrorWithMessage(c, "Internal server error")
}

func HTMLServerErrorWithError(c *fiber.Ctx, err error) error {
	return HTMLServerErrorWithMessage(c, err.Error())
}

func HTMLServerErrorWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusInternalServerError, message)
}

func HTMLBadRequest(c *fiber.Ctx) error {
	return HTMLBadRequestWithMessage(c, "Bad request")
}

func HTMLBadRequestWithError(c *fiber.Ctx, err error) error {
	return HTMLBadRequestWithMessage(c, err.Error())
}

func HTMLBadRequestWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusBadRequest, message)
}

func HTMLUnauthorized(c *fiber.Ctx) error {
	return HTMLUnauthorizedWithMessage(c, "Unauthorized")
}

func HTMLUnauthorizedWithError(c *fiber.Ctx, err error) error {
	return HTMLUnauthorizedWithMessage(c, err.Error())
}

func HTMLUnauthorizedWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusUnauthorized, message)
}

func HTMLForbidden(c *fiber.Ctx) error {
	return HTMLForbiddenWithMessage(c, "Forbidden")
}

func HTMLForbiddenWithError(c *fiber.Ctx, err error) error {
	return HTMLForbiddenWithMessage(c, err.Error())
}

func HTMLForbiddenWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusForbidden, message)
}

func HTMLServiceUnavailable(c *fiber.Ctx) error {
	return HTMLServiceUnavailableWithMessage(c, "Service unavailable")
}

func HTMLServiceUnavailableWithError(c *fiber.Ctx, err error) error {
	return HTMLServiceUnavailableWithMessage(c, err.Error())
}

func HTMLServiceUnavailableWithMessage(c *fiber.Ctx, message string) error {
	return HTMLError(c, fiber.StatusServiceUnavailable, message)
}
