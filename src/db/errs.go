// Package db
// Created by RTT.
// Author: teocci@yandex.com on 2025-2월-11
package db

import "errors"

var (
	ErrNotFound              = errors.New("not found")
	ErrExists                = errors.New("already exists")
	ErrNoRows                = errors.New("no rows")
	ErrProviderAlreadyLinked = errors.New("user is already linked to this provider")
)
