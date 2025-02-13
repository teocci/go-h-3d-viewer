// Package pages
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-12
package pages

import (
	"github.com/gofiber/fiber/v2"
	"github.com/teocci/go-hynix-3d-viewer/src/webserver/renders"
)

type PageType string

const (
	LoginPage     PageType = "login"
	DashboardPage PageType = "dashboard"
	LoaderPage    PageType = "loader"
	ViewerPage    PageType = "viewer"
)

var pageTitles = map[PageType]string{
	LoginPage:     "Login",
	DashboardPage: "Dashboard",
	LoaderPage:    "Loader",
	ViewerPage:    "Viewer",
}

func ParsePageType(page string) (PageType, bool) {
	switch PageType(page) {
	case LoginPage, DashboardPage, LoaderPage, ViewerPage:
		return PageType(page), true
	default:
		return "", false
	}
}

func HandlePages(c *fiber.Ctx) error {
	pageName := c.Params("page")

	pageType, valid := ParsePageType(pageName)
	if !valid {
		return renders.StringNotFound(c)
	}

	page := renders.PageInfo{Name: pageName, Title: pageTitles[pageType]}

	switch pageType {
	case LoginPage:
		return handleLoginPage(c, page)
	case DashboardPage:
		return handleDashboardPage(c, page)
	case LoaderPage:
		return handleLoaderPage(c, page)
	case ViewerPage:
		return handleViewerPage(c, page)
	default:
		return renders.StringNotFound(c)
	}
}

func handleLoaderPage(c *fiber.Ctx, page renders.PageInfo) error {
	return renders.HTMLPage(c, page)
}

func handleDashboardPage(c *fiber.Ctx, page renders.PageInfo) error {
	return renders.HTMLPage(c, page)
}
