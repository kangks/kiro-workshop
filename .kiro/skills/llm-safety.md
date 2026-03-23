---
inclusion: manual
---

# LLM Safety & Guardrails

Best practices for securing LLM-powered applications against adversarial use, data leakage, and uncontrolled behavior.

## OWASP LLM Top 10 Checklist

When reviewing or modifying LLM integration code, assess against these categories:

- LLM01 Prompt Injection: Validate that user input is separated from system instructions. Use delimiters, role-based message formatting, and input sanitization. Never concatenate raw user text into system prompts.
- LLM02 Insecure Output Handling: Treat all LLM output as untrusted. Sanitize before rendering in HTML, executing as code, or passing to downstream systems. Never eval() or exec() LLM responses.
- LLM03 Training Data Poisoning: If fine-tuning or using RAG, validate data sources. Implement provenance tracking for all ingested content.
- LLM04 Model Denial of Service: Set token limits on both input and output. Implement request timeouts and rate limiting per user/session.
- LLM05 Supply Chain Vulnerabilities: Pin model versions. Validate model checksums when downloading. Use trusted model registries only.
- LLM06 Sensitive Information Disclosure: Scan prompts and context for PII before sending to models. Redact sensitive data from logs and traces.
- LLM07 Insecure Plugin Design: Agent tools must validate inputs, enforce least-privilege access, and require authentication. Never give tools unrestricted database or filesystem access.
- LLM08 Excessive Agency: Limit tool capabilities to the minimum required. Require human approval for destructive operations (delete, update, send).
- LLM09 Overreliance: Never use LLM output as the sole input for security decisions, financial transactions, or safety-critical operations.
- LLM10 Model Theft: Protect model endpoints with authentication. Don't expose model metadata or weights through APIs.

## Prompt Injection Defenses

- Separate system instructions from user input using distinct message roles (system, user, assistant)
- Apply input validation: length limits, character filtering, pattern detection for known injection payloads
- Use output validation to detect when the model has deviated from expected behavior
- Implement canary tokens in system prompts to detect extraction attempts
- For RAG applications, sanitize retrieved context before injecting into prompts

## Token Budget Management

- Set explicit `max_tokens` on every LLM call — never leave it unbounded
- Track cumulative token usage per session/user for cost control
- Implement circuit breakers: if a single request exceeds a threshold, abort and return a fallback response
- Log token usage per request for observability and cost attribution

## Model Fallback Chains

- Define a primary model and at least one fallback for each use case
- Fallback triggers: timeout, rate limit, error response, or quality threshold not met
- Log which model served each request for debugging and cost tracking
- Test fallback paths explicitly — don't assume they work

## Content Filtering

- Apply input filters before the LLM call (block known-bad patterns)
- Apply output filters after the LLM call (detect harmful, off-topic, or policy-violating content)
- Use structured output formats (JSON schema validation) where possible to constrain responses
- Log filtered content for audit and pattern analysis
