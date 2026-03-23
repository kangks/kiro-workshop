# Requirements Document

## Introduction

This document defines the requirements for accurately documenting the DVAIA (Damn Vulnerable AI Application) architecture. DVAIA is a deliberately vulnerable web application built for AI red-team testing and security research. These requirements specify what the architecture documentation must capture about the existing codebase — covering the Flask UI layer, LangChain orchestration, Ollama LLM integration, Qdrant vector database, authentication, document management, URL fetching, payload generation, and intentional security vulnerabilities.

## Glossary

- **DVAIA**: Damn Vulnerable AI Application — the target system being documented
- **Flask_Server**: The Flask HTTP application defined in `api/server.py` that serves the frontend and REST API
- **Chat_Handler**: The chat orchestration module (`app/chat.py`) that builds context and delegates to the LLM
- **Agent_Runner**: The ReAct-style agent module (`app/agent.py`) that executes tool-calling loops
- **LLM_Factory**: The factory module (`core/llm.py`) that creates LangChain `ChatOllama` instances
- **Model_Router**: The model routing module (`core/models.py`) that maps requests to LLM invocations
- **Config_Manager**: The configuration modules (`core/config.py`, `app/config.py`) that load environment variables
- **Embedding_Service**: The embedding module (`app/embeddings.py`) that produces vector representations via Ollama
- **RAG_Retrieval**: The retrieval module (`app/retrieval.py`) that chunks, embeds, and searches documents
- **Vector_Store**: The Qdrant client module (`app/vector_store.py`) that manages point storage and search
- **Auth_Module**: The authentication module (`app/auth.py`) that handles login and password verification
- **MFA_Module**: The MFA verification module (`app/mfa.py`) that checks codes against the database
- **Document_Manager**: The document module (`app/documents.py`) that handles upload, extraction, and CRUD
- **URL_Fetcher**: The URL fetching module (`app/fetch.py`) that retrieves external web content
- **Payload_Generator**: The payload package (`payloads/`) that creates test assets for injection attacks
- **Architecture_Documentation**: The set of markdown documents produced by this spec

## Requirements

### Requirement 1: Flask API Layer Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe all Flask API endpoints, so that I can understand the full attack surface of the application.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL list every route registered in `api/server.py` with its HTTP method, URL path, and purpose
2. WHEN documenting the `/api/chat` endpoint, THE Architecture_Documentation SHALL describe the `prompt`, `messages`, `model_id`, `options`, `context_from`, `document_id`, `url`, and `rag_query` parameters
3. WHEN documenting the `/api/agent/chat` endpoint, THE Architecture_Documentation SHALL describe the `prompt`, `model_id`, `messages`, `tool_names`, `max_steps`, and `timeout` parameters
4. WHEN documenting the `/api/chat-with-template` endpoint, THE Architecture_Documentation SHALL describe the `template` and `user_input` parameters and the `{{user_input}}` substitution mechanism
5. THE Architecture_Documentation SHALL document that the Flask_Server delegates all business logic to `app.*` modules and performs no direct database or LLM calls
6. THE Architecture_Documentation SHALL document the frontend structure: single HTML page (`index.html`) with 8 tabbed attack panels and the JavaScript modules (`app.js`, `session.js`, `documents.js`, `rag.js`, `payloads.js`)

### Requirement 2: LangChain Chat Orchestration Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the chat orchestration flow, so that I can understand how user prompts and injected context reach the LLM.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe the `handle_chat()` function signature and its parameters: `prompt`, `user_id`, `model_id`, `context_from`, `document_id`, `url`, `rag_query`, `timeout`, `options`, `messages`
2. WHEN documenting context injection, THE Architecture_Documentation SHALL describe that document text, URL content, and RAG chunks are prepended to the user prompt with labels and no sanitization
3. WHEN documenting multi-turn chat, THE Architecture_Documentation SHALL describe that when `messages` is provided, context building is bypassed and the full conversation history is sent directly to `generate()`
4. THE Architecture_Documentation SHALL describe the `generate()` function in `core/models.py` including its option mapping for `temperature`, `top_k`, `top_p`, `repeat_penalty`, and `num_predict`/`max_tokens`

### Requirement 3: ReAct Agent Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the agentic ReAct loop, so that I can understand how the agent selects and invokes tools.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL list all 6 agent tools by name: `list_users`, `list_documents`, `list_secret_agents`, `get_document_by_id`, `delete_document_by_id`, `get_internal_config`
2. WHEN documenting each agent tool, THE Architecture_Documentation SHALL specify its access level (read or write) and describe its behavior
3. THE Architecture_Documentation SHALL describe the ReAct loop: LLM invocation, tool call extraction, tool execution, message appending, and the `max_steps` termination condition (default 15, max 50)
4. THE Architecture_Documentation SHALL document that the agent uses `qwen3:0.6b` by default with `reasoning=True` for chain-of-thought visibility
5. THE Architecture_Documentation SHALL document that agent tools have no authentication checks and that `delete_document_by_id` is destructive without authorization

### Requirement 4: Ollama LLM Integration Documentation

**User Story:** As a developer, I want the documentation to accurately describe the LLM factory and model resolution, so that I can understand how models are selected and configured.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe the `get_llm()` factory function: its parameters (`model_id`, `timeout`, `**kwargs`) and return type (`ChatOllama` instance)
2. THE Architecture_Documentation SHALL describe model ID resolution: stripping the `ollama:` prefix (case-insensitive), falling back to `"llama3.2"` when empty
3. THE Architecture_Documentation SHALL document the two default models: `DEFAULT_MODEL = "ollama:llama3.2"` for chat panels and `AGENTIC_MODEL = "qwen3:0.6b"` for the agentic panel
4. THE Architecture_Documentation SHALL document that configuration is loaded from `.env` via `python-dotenv` with lazy loading on first access, and that all getters have sensible defaults

### Requirement 5: Qdrant Vector Database and RAG Pipeline Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the RAG pipeline, so that I can understand how documents are chunked, embedded, stored, and retrieved.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe the chunking strategy: 500-character chunks with 50-character overlap, paragraph-boundary preference, and 8000-character embedding truncation limit
2. THE Architecture_Documentation SHALL describe the embedding service: Ollama backend only, `nomic-embed-text` default model, lazy singleton initialization, and the `embed_text()` / `embed_texts()` functions
3. THE Architecture_Documentation SHALL describe the Qdrant point schema: UUID string ID, float vector, and payload fields (`source`, `content`, `created_at`) with cosine distance
4. THE Architecture_Documentation SHALL describe the diverse search algorithm: fetch up to 200 candidates, group by source, take top 10 per source, sort by score descending
5. THE Architecture_Documentation SHALL document that the vector store collection (`rag_chunks`) is auto-created on first `add_point()` and that Qdrant starts ephemeral (no persistent volume) in Docker Compose
6. THE Architecture_Documentation SHALL document the `cosine_similarity()` utility function in `app/embeddings.py` as a pure-Python implementation

### Requirement 6: Authentication and Session Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the authentication mechanism, so that I can understand the intentional weaknesses.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe the password hashing mechanism: SHA256 without salt, implemented in `app/auth.py`
2. THE Architecture_Documentation SHALL describe the session management: Flask session storing `user_id` and `mfa_verified` flag
3. THE Architecture_Documentation SHALL describe the MFA verification flow: check `mfa_codes` table first, then `backup_codes` table as fallback
4. THE Architecture_Documentation SHALL document the seeded test data: username `test`, password `test`, MFA code `123456`, backup codes `backup1`/`backup2`/`backup3`
5. THE Architecture_Documentation SHALL document the hardcoded Flask secret key default: `"dev-secret-change-in-production"` in `app/config.py`

### Requirement 7: Document Management Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe document upload and text extraction, so that I can understand how injected content enters the system.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe the upload flow: save to `UPLOAD_DIR` with UUID-prefixed filename, extract text, insert database row
2. THE Architecture_Documentation SHALL list all supported extraction formats: PDF (PyPDF2), DOCX (python-docx), images (Pillow + pytesseract OCR), plain text, and CSV
3. THE Architecture_Documentation SHALL describe the lazy extraction behavior: if `extracted_text` is null on retrieval, extract and update the database
4. THE Architecture_Documentation SHALL describe the delete flow: remove file from disk, then delete the database row

### Requirement 8: URL Fetcher Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the URL fetching mechanism, so that I can understand the SSRF attack surface.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL describe that only `http://` and `https://` URL schemes are accepted
2. THE Architecture_Documentation SHALL describe that `curl_cffi` is used with Chrome impersonation for browser-like TLS fingerprinting
3. THE Architecture_Documentation SHALL describe the HTML stripping process: remove `<script>` and `<style>` tags, strip all HTML tags, collapse whitespace
4. THE Architecture_Documentation SHALL document that no SSRF allowlist exists — any HTTP/HTTPS URL is fetched

### Requirement 9: Payload Generator Documentation

**User Story:** As a security researcher, I want the documentation to accurately describe the payload generation capabilities, so that I can understand what attack assets can be created.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL list all payload asset types: text, CSV, PDF (text overlay, hidden content, metadata injection), image (text overlay with font/color/alpha/rotation/blur/noise), QR code, audio synthetic (WAV sine tone), and audio TTS (gTTS)
2. WHEN documenting each payload type, THE Architecture_Documentation SHALL specify the generating module and output format
3. THE Architecture_Documentation SHALL document the output directory configuration: `PAYLOADS_OUTPUT_DIR` env variable, defaulting to `payloads/generate/` locally or `/tmp/payloads/generate` in Docker

### Requirement 10: SQLite Database Schema Documentation

**User Story:** As a developer, I want the documentation to accurately describe the database schema, so that I can understand the data model.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL document all 5 SQLite tables: `users`, `mfa_codes`, `backup_codes`, `documents`, `secret_agents`
2. WHEN documenting each table, THE Architecture_Documentation SHALL list all columns with their types, constraints (PK, FK, UNIQUE, NOT NULL), and defaults
3. THE Architecture_Documentation SHALL document the `init_db()` seeding behavior: test user creation, MFA code insertion, secret agent seeding, and the idempotency checks (skip if already present)
4. THE Architecture_Documentation SHALL document that raw SQL queries are used throughout with no ORM

### Requirement 11: Docker Compose Topology Documentation

**User Story:** As a developer, I want the documentation to accurately describe the container topology, so that I can understand how to deploy and run the application.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL document all 3 Docker Compose services: `ollama` (model runtime), `qdrant` (vector database), and `dvaia` (Flask application)
2. THE Architecture_Documentation SHALL document the network configuration: `dvaia` bridge network with inter-service communication via hostnames
3. THE Architecture_Documentation SHALL document the Ollama auto-pull behavior: `llama3.2`, `nomic-embed-text`, and `qwen3:0.6b` pulled on first startup
4. THE Architecture_Documentation SHALL document that Qdrant has no persistent volume and starts empty on each `docker compose up`
5. THE Architecture_Documentation SHALL document the port mappings: 5000 (Flask), 11434 (Ollama), 6333 (Qdrant)

### Requirement 12: Intentional Security Vulnerabilities Documentation

**User Story:** As a security researcher, I want the documentation to catalog all intentional vulnerabilities, so that I can use them as a reference for red-team exercises.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL document each intentional vulnerability with its location in the codebase and the mechanism that makes it exploitable
2. THE Architecture_Documentation SHALL document the following vulnerability classes: direct prompt injection, document injection, web/SSRF injection, RAG poisoning, template injection, agentic tool abuse, weak password hashing, no CSRF protection, hardcoded secrets, and static MFA codes
3. WHEN documenting each vulnerability, THE Architecture_Documentation SHALL reference the specific API endpoint or source file where the vulnerability exists

### Requirement 13: Error Handling Documentation

**User Story:** As a developer, I want the documentation to describe error handling behavior, so that I can understand how the system degrades under failure conditions.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL document the Ollama unavailable scenario: connection error propagated as HTTP 500 with no retry logic
2. THE Architecture_Documentation SHALL document the Qdrant unavailable scenario: vector store methods catch exceptions and return empty results for graceful degradation
3. THE Architecture_Documentation SHALL document the embedding failure scenario: `RuntimeError` raised when embedding returns empty, search returns empty results
4. THE Architecture_Documentation SHALL document the document extraction failure scenario: `extract_text()` catches exceptions and returns empty string, with lazy retry on next retrieval
5. THE Architecture_Documentation SHALL document the agent max-steps scenario: returns last AIMessage content or fallback text after reaching `max_steps` limit

### Requirement 14: Dependencies Documentation

**User Story:** As a developer, I want the documentation to list all dependencies, so that I can understand the technology stack and system requirements.

#### Acceptance Criteria

1. THE Architecture_Documentation SHALL list all Python packages from `requirements.txt` with their purpose
2. THE Architecture_Documentation SHALL document the external services: Ollama (image, port, purpose) and Qdrant (image, port, purpose)
3. THE Architecture_Documentation SHALL document system-level dependencies: `tesseract-ocr` for OCR and `ffmpeg` for audio format conversion
