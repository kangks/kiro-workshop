---
inclusion: manual
---

# LLM Observability

Best practices for logging, tracing, and monitoring LLM-powered applications in production.

## Structured Logging

- Use structured log format (JSON) for all LLM-related events — never unstructured print statements
- Every LLM call log entry must include: timestamp, request_id, model_id, input_tokens, output_tokens, latency_ms, status (success/error)
- Log prompt templates and variable names but never log raw user input or full prompts in production (PII risk)
- Use log levels consistently: DEBUG for full payloads (dev only), INFO for call metadata, WARN for fallbacks/retries, ERROR for failures
- Correlate logs across the request lifecycle with a shared request_id or trace_id

## LLM Call Tracing

- Instrument every LLM call with span-based tracing (OpenTelemetry or equivalent)
- Capture spans for: prompt construction, model inference, output parsing, tool execution (for agents)
- Record these attributes per span: model_name, model_version, temperature, max_tokens, token_count_in, token_count_out
- For agentic workflows, trace the full ReAct loop — each reasoning step and tool call as child spans
- For RAG pipelines, trace: embedding generation, vector search, context assembly, and final LLM call as separate spans

## Cost Tracking

- Calculate cost per request using model-specific token pricing
- Aggregate costs by: user, session, endpoint, model, and time period
- Set budget alerts at the user, team, and application level
- Log cost alongside latency in every LLM call trace
- Track cost trends over time to detect regressions from prompt changes or model upgrades

## Latency Monitoring

- Track p50, p90, p95, and p99 latency for all LLM endpoints
- Set latency SLOs per endpoint (e.g., chat < 3s p95, agent < 10s p95)
- Alert on sustained latency increases — they often indicate model degradation or infrastructure issues
- Measure time-to-first-token separately from total response time for streaming endpoints
- Monitor queue depth and concurrency if using rate-limited model APIs

## Error Classification

- Categorize LLM errors: model_timeout, rate_limit, invalid_response, content_filter_triggered, context_length_exceeded, model_unavailable
- Track error rates per model and per endpoint
- Implement automatic retry with exponential backoff for transient errors (rate_limit, timeout)
- Never retry on content_filter or context_length errors — these require prompt adjustment
- Alert on error rate spikes — they often precede outages

## Health Checks

- Implement a lightweight health endpoint that verifies model connectivity (small inference call)
- Check vector store connectivity separately from model health
- Health checks should timeout fast (< 5s) and not consume significant resources
- Include model availability and version in health check responses
- Use health checks for load balancer routing and deployment readiness gates

## Dashboard Essentials

Every LLM application should surface these metrics:
- Requests per second by endpoint
- Token usage (input + output) over time
- Latency distribution (p50/p90/p99) by endpoint
- Error rate by category
- Cost per hour/day by model
- Active sessions / concurrent users
- RAG retrieval hit rate (queries with relevant results vs. empty results)
