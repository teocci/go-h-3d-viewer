// Package requests
// Created by RTT.
// Author: teocci@yandex.com on 2025-1월-17
package requests

import "github.com/sashabaranov/go-openai"

type UserCompletionRequest struct {
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	Model string `json:"model"`
	Group string `json:"group"`
}

func (u *UserCompletionRequest) AsChatCompletion() []openai.ChatCompletionMessage {
	// Add the system prompt
	var messages []openai.ChatCompletionMessage

	// Append user messages
	for _, msg := range u.Messages {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	return messages
}
