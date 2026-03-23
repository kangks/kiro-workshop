---
inclusion: manual
---

# Agent Tool Design

Best practices for designing, implementing, and securing tools in LLM agent architectures (ReAct, function calling, tool-use patterns).

## Tool Interface Design

- Every tool must have a clear, concise description that tells the LLM when and why to use it
- Parameter names should be self-documenting — prefer `user_id` over `id`, `search_query` over `q`
- Define explicit parameter types and constraints (min/max values, allowed patterns, enums)
- Return structured data (JSON) with consistent schema — never return raw database rows or unformatted text
- Include an `error` field in tool responses so the agent can reason about failures

## Least Privilege

- Each tool should have the minimum permissions required for its function
- Read tools must not have write access. Write tools must not have delete access. Separate concerns.
- Scope database queries to the authenticated user's data — never return all rows unconditionally
- File system tools must be sandboxed to specific directories — never allow arbitrary path traversal
- Network tools must use allowlists for permitted hosts/endpoints

## Authentication & Authorization

- Every tool invocation must carry the caller's identity (user_id, session, or API key)
- Validate authorization before executing — don't rely on the LLM to enforce access control
- Destructive tools (delete, update, send) should require explicit confirmation or elevated permissions
- Log every tool invocation with: tool_name, caller_identity, parameters, result_status, timestamp

## Input Validation

- Validate all tool inputs at the tool boundary — never trust the LLM to provide clean data
- Reject inputs that exceed expected size limits
- Sanitize string inputs against injection attacks (SQL, command, path traversal)
- For ID parameters, validate format and existence before querying
- Return clear error messages that help the agent self-correct (e.g., "user_id must be a positive integer, got: -1")

## Error Handling

- Tools must never raise unhandled exceptions — always return structured error responses
- Categorize errors: invalid_input, not_found, unauthorized, rate_limited, internal_error
- Include actionable guidance in error messages so the agent can retry or choose an alternative tool
- Set timeouts on all external calls (database, API, network) — never let a tool hang indefinitely
- Log errors with full context for debugging but sanitize sensitive data before logging

## Agent Loop Safety

- Set a maximum step count for the agent loop — prevent infinite tool-calling cycles
- Implement cost guards: abort if cumulative token usage or tool calls exceed a threshold
- Detect repetitive tool calls (same tool, same parameters, same result) and break the loop
- For multi-step workflows, checkpoint intermediate state so partial progress isn't lost on failure
- Return a meaningful fallback response when the agent exceeds its step limit

## Tool Testing

- Unit test each tool in isolation with mocked dependencies
- Test happy path, invalid inputs, missing resources, and authorization failures
- Test tool descriptions with the actual LLM to verify the model selects the right tool for given prompts
- Integration test the full agent loop with a representative set of user queries
- Test edge cases: what happens when the tool returns empty results, very large results, or errors
