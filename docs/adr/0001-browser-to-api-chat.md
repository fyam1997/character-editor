# ADR-0001: Browser-to-API chat (no proxy server)

The chat room calls OpenAI-compatible LLM endpoints directly from the browser,
not through a backend proxy.

## Context

The editor includes a built-in chat room for testing character cards against
real LLMs. The typical approach in similar tools is to run a proxy server
that forwards requests (handles CORS, rate limiting, key hiding).

## Decision

Skip the proxy. The user configures their own base URL, API key, and model
name in the System Config panel. The browser calls the API directly via
`fetch()`. No backend server to deploy.

## Rationale

- This is a local, single-user tool. No secrets to protect from other users.
- The OpenAI-compatible API shape (OpenAI, OpenRouter, Together, local LLMs)
  mostly supports browser CORS requests when the user provides a key.
- Zero server deployment eliminates the biggest barrier to using the tool.
- If a provider doesn't support browser CORS (Anthropic, Gemini natively),
  the user can route through OpenRouter or a local proxy they already run.
- Fewer moving parts, no Docker, no env vars, no hosting costs.

## Consequences

- API keys are stored in IndexedDB (same origin, same security model as any
  client-side credential — acceptable for a local dev tool).
- Users of providers that don't support CORS will need OpenRouter or a local
  reverse proxy. Documented in System Config.
- No server-side rate limiting. If the user exceeds API limits, they handle
  it at the provider level.
