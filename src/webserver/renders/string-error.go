// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package renders

import (
	"github.com/gofiber/fiber/v2"
)

func StringError(c *fiber.Ctx, code int, message string) error {
	return c.Status(code).SendString(message)
}

func StringNotFound(c *fiber.Ctx) error {
	return StringNotFoundWithMessage(c, "Page not found")
}

func StringNotFoundWithError(c *fiber.Ctx, err error) error {
	return StringNotFoundWithMessage(c, err.Error())
}

func StringNotFoundWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusNotFound, message)
}

func StringServerError(c *fiber.Ctx) error {
	return StringServerErrorWithMessage(c, "Internal server error")
}

func StringServerErrorWithError(c *fiber.Ctx, err error) error {
	return StringServerErrorWithMessage(c, err.Error())
}

func StringServerErrorWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusInternalServerError, message)
}

func StringBadRequest(c *fiber.Ctx) error {
	return StringBadRequestWithMessage(c, "Bad request")
}

func StringBadRequestWithError(c *fiber.Ctx, err error) error {
	return StringBadRequestWithMessage(c, err.Error())
}

func StringBadRequestWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusBadRequest, message)
}

func StringUnauthorized(c *fiber.Ctx) error {
	return StringUnauthorizedWithMessage(c, "Unauthorized")
}

func StringUnauthorizedWithError(c *fiber.Ctx, err error) error {
	return StringUnauthorizedWithMessage(c, err.Error())
}

func StringUnauthorizedWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusUnauthorized, message)
}

func StringForbidden(c *fiber.Ctx) error {
	return StringForbiddenWithMessage(c, "Forbidden")
}

func StringForbiddenWithError(c *fiber.Ctx, err error) error {
	return StringForbiddenWithMessage(c, err.Error())
}

func StringForbiddenWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusForbidden, message)
}

func StringServiceUnavailable(c *fiber.Ctx) error {
	return StringServiceUnavailableWithMessage(c, "Service unavailable")
}

func StringServiceUnavailableWithError(c *fiber.Ctx, err error) error {
	return StringServiceUnavailableWithMessage(c, err.Error())
}

func StringServiceUnavailableWithMessage(c *fiber.Ctx, message string) error {
	return StringError(c, fiber.StatusServiceUnavailable, message)
}
