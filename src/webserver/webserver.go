// Package webserver
// Created by RTT.
// Author: teocci@yandex.com on 2025-1월-14
package webserver

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"

	"github.com/teocci/go-hynix-3d-viewer/src/config"
)

func Start(cfg *config.ServerSetup) {
	engine := html.New("./src/views", ".tpl")
	engine.Reload(true)

	app := fiber.New(fiber.Config{
		Views:       engine,
		ViewsLayout: "layouts/main",
	})

	// Register routes
	registerAuthEndpoints(app)
	registerPages(app)
	registerAPIEndpoints(app)

	// Start server
	port := cfg.Web.Port
	log.Printf("Listening on :%d", port)
	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}
