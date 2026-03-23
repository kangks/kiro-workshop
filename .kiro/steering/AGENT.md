---
inclusion: always
---

# DVAIA Modernization & Security Hardening Guide

This workspace contains DVAIA (Damn Vulnerable AI Application), a deliberately vulnerable Flask app for AI red-team testing. All work here targets modernizing the codebase and hardening its security posture while preserving its educational value as a vulnerable-by-design platform.

## Project Context

- Python Flask backend at `DVAIA-Damn-Vulnerable-AI-Application/`
- LangChain orchestration for chat and agentic workflows against Ollama LLMs
- Qdrant vector database for RAG storage and semantic search
- SQLite for user/document/agent data
- Docker Compose topology: `ollama`, `qdrant`, `dvaia` on a bridge network
- Single-page frontend with 8 attack panels (Direct Injection, Document Injection, Web Injection, RAG Poisoning, Template Injection, Agentic, Payloads, Instructions)

## Architecture Layers

1. Flask HTTP layer: `api/server.py` — thin delegation, no business logic
2. LangChain orchestration: `app/chat.py`, `app/agent.py` — chat + ReAct agent with 6 SQLite-backed tools
3. Ollama integration: `core/llm.py`, `core/models.py` — factory for ChatOllama instances
4. RAG pipeline: `app/embeddings.py`, `app/retrieval.py`, `app/vector_store.py` — embed, store, search via Qdrant
5. Auth & session: `app/auth.py`, `app/mfa.py` — SHA256 hashing, Flask sessions, static MFA
6. Document management: `app/documents.py` — upload, extract text (PDF, DOCX, image OCR, CSV, TXT)
7. URL fetcher: `app/fetch.py` — curl_cffi with no SSRF allowlist
8. Payload generator: `payloads/` — text, CSV, PDF, image, QR, audio assets

## Intentional Vulnerabilities (Preserve These)

The following are deliberate and must not be "fixed" unless explicitly toggled by a security-level flag:

| Vulnerability | Location |
|---|---|
| Direct prompt injection | `/api/chat` — no input filtering |
| Document injection | `app/chat.py` — unsanitized context prepend |
| Web/SSRF injection | `app/fetch.py` — any HTTP/HTTPS URL fetched |
| RAG poisoning | `/api/rag/chunks` POST — no validation |
| Template injection | `/api/chat-with-template` — string substitution, no escaping |
| Agentic tool abuse | `app/agent.py` — tools have no auth checks |
| Weak password hashing | `app/auth.py` — SHA256, no salt |
| No CSRF protection | All POST endpoints |
| Hardcoded secrets | `app/config.py` — default SECRET_KEY |
| Static MFA codes | `app/db.py` seed — `123456`, `backup1`/`backup2`/`backup3` |

When modernizing, introduce a configurable security level (e.g., `SECURITY_LEVEL=vulnerable|hardened`) so vulnerabilities can be toggled for training vs. production use.

## Coding Standards

- Python 3.10+ with type hints on all new functions
- Use `pathlib.Path` over `os.path` for file operations
- Prefer `logging` module over `print()` for all output
- Keep Flask routes as thin delegation — business logic belongs in `app/` modules
- Raw SQL is acceptable for this project (no ORM), but parameterize all queries in hardened mode
- Environment variables via `python-dotenv`; never hardcode secrets in new code
- All new modules must include docstrings at module and function level

## Security Hardening Rules

When working in hardened mode or adding security improvements:

- Replace SHA256 password hashing with `bcrypt` or `argon2`
- Add CSRF token validation to all state-changing endpoints
- Implement SSRF allowlists for URL fetching
- Sanitize all user input before LLM context injection
- Add authentication checks to agent tools
- Use parameterized SQL queries exclusively
- Generate cryptographically random SECRET_KEY on first run
- Implement rate limiting on auth endpoints
- Add input validation and size limits on file uploads
- Escape template substitutions properly

## Testing Approach

- Use `pytest` as the test runner
- Tests live in a `tests/` directory at the project root
- Unit tests should verify:
  - Route existence and HTTP methods match the documented API
  - Database schema matches documented tables and columns
  - Agent tool names and access levels match documentation
  - Configuration defaults match documented values
  - Document extraction handles all supported formats
  - Payload generation covers all documented asset types
- Integration tests require Docker Compose (Ollama + Qdrant running)
- Mock Ollama and Qdrant for unit tests — don't require live services
- Follow the TDD workflow defined in `test-driven-development.md`

## Key Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DEFAULT_MODEL` | `ollama:llama3.2` | Chat model |
| `AGENTIC_MODEL` | `qwen3:0.6b` | Agent model (supports reasoning) |
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama endpoint |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |
| `QDRANT_COLLECTION` | `rag_chunks` | Vector store collection name |
| `SECRET_KEY` | `dev-secret-change-in-production` | Flask session key |
| `PORT` | `5000` | Flask server port |

## Docker Compose Services

| Service | Image | Port | Notes |
|---|---|---|---|
| `ollama` | `ollama/ollama:latest` | 11434 | Auto-pulls llama3.2, nomic-embed-text, qwen3:0.6b |
| `qdrant` | `qdrant/qdrant:latest` | 6333 | Ephemeral — no persistent volume |
| `dvaia` | Custom Dockerfile | 5000 | Mounts project root as `/app` |

## Dependencies to Know

- `curl_cffi` for browser-impersonating HTTP (URL fetcher)
- `langchain` + `langchain-ollama` for LLM orchestration
- `qdrant-client` for vector DB operations
- `PyPDF2`, `python-docx`, `pytesseract`, `Pillow` for document extraction
- `reportlab`, `qrcode`, `gTTS`, `pydub`, `numpy`, `scipy` for payload generation
- System deps: `tesseract-ocr` (OCR), `ffmpeg` (audio conversion)

## RAG Pipeline Details

- Chunking: 500 chars with 50-char overlap, paragraph-boundary-aware
- Max 8000 chars per chunk
- Diverse search: fetch 200 candidates, group by source, top 10 per source
- Embeddings via Ollama `nomic-embed-text`, cosine similarity in Qdrant

## Error Handling Patterns

- Ollama down → HTTP 500, no retry logic
- Qdrant down → graceful degradation, empty results, auto-recreate collection on next write
- Embedding failure → `RuntimeError("Could not embed chunk")`
- Document extraction failure → returns empty string, lazy retry on next fetch
- Agent max steps (15) → returns last message or fallback text
