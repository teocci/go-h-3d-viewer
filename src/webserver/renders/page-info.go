// Package renders
// Created by RTT.
// Author: teocci@yandex.com on 2022-12월-24
package renders

// P is a shortcut for map[string]any, similar to gin.H
type P map[string]any

type PageInfo struct {
	Title      string `json:"title"`
	Name       string `json:"name"`
	Controller string `json:"controller"`
	Action     string `json:"action"`
	Tab        string `json:"tab"`
	UserUUID   string `json:"user_uuid"`
	// Dynamic parameters storage
	Params map[string]any `json:"params,omitempty"`
}

// SetParams sets multiple parameters at once using P
func (p *PageInfo) SetParams(params P) {
	if p.Params == nil {
		p.Params = make(P)
	}
	for k, v := range params {
		p.Params[k] = v
	}
}

// SetParam adds or updates a single parameter value
func (p *PageInfo) SetParam(key string, value any) {
	if p.Params == nil {
		p.Params = make(P)
	}
	p.Params[key] = value
}

// GetParam retrieves a parameter value
func (p *PageInfo) GetParam(key string) (any, bool) {
	if p.Params == nil {
		return nil, false
	}
	value, exists := p.Params[key]
	return value, exists
}

func (p *PageInfo) GetStringParam(key string) (string, bool) {
	if val, exists := p.GetParam(key); exists {
		if strVal, ok := val.(string); ok {
			return strVal, true
		}
	}
	return "", false
}

func (p *PageInfo) GetIntParam(key string) (int, bool) {
	if val, exists := p.GetParam(key); exists {
		if intVal, ok := val.(int); ok {
			return intVal, true
		}
	}
	return 0, false
}

func (p *PageInfo) GetBoolParam(key string) (bool, bool) {
	if val, exists := p.GetParam(key); exists {
		if boolVal, ok := val.(bool); ok {
			return boolVal, true
		}
	}
	return false, false
}
