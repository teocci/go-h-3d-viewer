// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2023-11월-17
package renders

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

func JSONError(c *fiber.Ctx, code int, err error) error {
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}

func JSONInvalidAction(c *fiber.Ctx) error {
	return JSONBadRequest(c, errors.New("invalid action"))
}

func JSONInternalError(c *fiber.Ctx, err error) error {
	return JSONError(c, fiber.StatusInternalServerError, err)
}

func JSONBadRequest(c *fiber.Ctx, err error) error {
	return JSONError(c, fiber.StatusBadRequest, err)
}

func JSONUnauthorized(c *fiber.Ctx, err error) error {
	return JSONError(c, fiber.StatusUnauthorized, err)
}

func JSONForbidden(c *fiber.Ctx, err error) error {
	return JSONError(c, fiber.StatusForbidden, err)
}

func JSONNotFound(c *fiber.Ctx, err error) error {
	return JSONError(c, fiber.StatusNotFound, err)
}

func JSONNotFoundWithPath(c *fiber.Ctx, msg string, path string) error {
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": msg,
		"path":  path,
	})
}
