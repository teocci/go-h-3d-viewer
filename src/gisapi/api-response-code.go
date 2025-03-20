// Package gisapi
// Created by RTT.
// Author: teocci@yandex.com on 2025-3월-07
package gisapi

// ResponseCode is a custom type for API response codes.
type ResponseCode int

const (
	ResponseCodeSuccess          ResponseCode = 1000 // Success
	ResponseCodeUndefined        ResponseCode = 1001 // Undefined
	ResponseCodeRequestJSONError ResponseCode = 2001 // Request JSON error
	ResponseCodeInternalError    ResponseCode = 2002 // Internal error
	ResponseCodeSQLError         ResponseCode = 2003 // SQL error
	ResponseCodeApiKeyError      ResponseCode = 2004 // ApiKey error
	ResponseCodeFuture           ResponseCode = 3001 // Reserved for future use
)

// AsString returns a human-readable representation of the ResponseCode.
func (rc ResponseCode) AsString() string {
	switch rc {
	case ResponseCodeSuccess:
		return "Success"
	case ResponseCodeUndefined:
		return "Undefined"
	case ResponseCodeRequestJSONError:
		return "Request JSON Error"
	case ResponseCodeInternalError:
		return "Internal Error"
	case ResponseCodeSQLError:
		return "SQL Error"
	case ResponseCodeApiKeyError:
		return "ApiKey Error"
	case ResponseCodeFuture:
		return "Reserved for Future Use"
	default:
		return "Unknown"
	}
}
