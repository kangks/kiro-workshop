# Design Document: DVAIA Architecture Documentation

## Overview

DVAIA (Damn Vulnerable AI Application) is a deliberately vulnerable web application built for AI red-team testing and security research. It provides a single-page Flask UI with eight interactive attack panels (Direct Injection, Document Injection, Web Injection, RAG Poisoning, Template Injection, Agentic, Payloads, and Instructions) that exercise different AI vulnerability classes against a local Ollama LLM backend.

The system is composed of four primary layers: a Flask HTTP server serving a single-page HTML frontend, a LangChain orchestration layer for chat and agentic workflows, an Ollama integration layer for local model inference and embeddings, and a Qdrant vector database for RAG storage and semantic search. All components are containerized via Docker Compose and communicate over a bridge network. Every endpoint is intentionally vulnerable — no input sanitization, no SSRF allowlists, no template escaping, no CSRF protection — to enable realistic red-team exercises.

## Architecture

### System Overview

```mermaid
graph TD
    Browser["Browser (Single-Page App)"]
    Flask["Flask API Server<br/>api/server.py<br/>Port 5000"]
    Chat["Chat Orchestration<br/>app/chat.py"]
    Agent["ReAct Agent<br/>app/agent.py"]
    LLM["LLM Factory<br/>core/llm.py + core/models.py"]
    Ollama["Ollama Runtime<br/>Port 11434"]
    Embeddings["Embedding Service<br/>app/embeddings.py"]
    Retrieval["RAG Retrieval<br/>app/retrieval.py"]
    VectorStore["Vector Store Client<br/>app/vector_store.py"]
    Qdrant["Qdrant Server<br/>Port 6333"]
    Auth["Auth + MFA<br/>app/auth.py + app/mfa.py"]
    Docs["Document Manager<br/>app/documents.py"]
    Fetch["URL Fetcher<br/>app/fetch.py"]
    DB["SQLite<br/>data/app.db"]
    Payloads["Payload Generator<br/>payloads/"]
    Disk["File System<br/>uploads + payloads"]

    Browser -->|"HTTP JSON/Multipart"| Flask
    Flask --> Chat
    Flask --> Agent
    Flask --> Auth
    Flask --> Docs
    Flask --> Payloads
    Flask --> Retrieval
    Chat --> LLM
    Chat --> Docs
    Chat --> Fetch
    Chat --> Retrieval
    Agent --> LLM
    Agent --> DB
    LLM --> Ollama
    Embeddings --> Ollama
    Retrieval --> Embeddings
    Retrieval --> VectorStore
    VectorStore --> Qdrant
    Auth --> DB
    Docs --> DB
    Docs --> Disk
    Payloads --> Disk
    Fetch -->|"curl_cffi"| Internet["External URLs"]
```

### Docker Compose Topology

```mermaid
graph LR
    subgraph "dvaia network (bridge)"
        OllamaC["ollama<br/>ollama/ollama:latest<br/>:11434"]
        QdrantC["qdrant<br/>qdrant/qdrant:latest<br/>:6333"]
        DVAIAC["dvaia<br/>Custom Dockerfile<br/>:5000"]
    end
    DVAIAC -->|"http://ollama:11434"| OllamaC
    DVAIAC -->|"http://qdrant:6333"| QdrantC
    OllamaC -.->|"auto-pull on start"| Models["llama3.2<br/>nomic-embed-text<br/>qwen3:0.6b"]
```

Services:
- `ollama`: Model runtime. Auto-pulls llama3.2, nomic-embed-text, and qwen3:0.6b on first start. Persistent volume for model weights.
- `qdrant`: Vector database. Ephemeral (no persistent volume) — starts empty each `docker compose up`.
- `dvaia`: Flask application. Mounts project root as `/app`. All runtime data in `/tmp` (database, uploads, payloads).

## Components and Interfaces

### Component 1: Flask UI Layer (`api/server.py`, `api/templates/index.html`)

**Purpose**: HTTP entry point. Serves the single-page frontend and exposes all REST API endpoints. Thin delegation layer — no business logic, just request parsing and response formatting.

**Interface**:

| Route | Method | Description |
|---|---|---|
| `/` | GET | Serve single-page HTML (index.html) |
| `/api/health` | GET | Health check |
| `/api/models` | GET | List available models and defaults |
| `/api/chat` | POST | Direct/document/web/RAG chat (delegates to `app.chat`) |
| `/api/chat-with-template` | POST | Template injection chat (substitutes `{{user_input}}` without escaping) |
| `/api/agent/chat` | POST | Agentic ReAct chat (delegates to `app.agent`) |
| `/api/login` | POST | Session login (username/password) |
| `/api/logout` | POST | Clear session |
| `/api/session` | GET | Current session info |
| `/api/mfa` | POST | MFA code verification |
| `/api/documents/upload` | POST | Multipart file upload |
| `/api/documents` | GET | List documents |
| `/api/documents/<id>` | GET/DELETE | Get or delete document |
| `/api/rag/search` | GET | Semantic search over RAG chunks |
| `/api/rag/chunks` | GET/POST | List or add RAG chunks |
| `/api/rag/add-document/<id>` | POST | Chunk, embed, and index a document |
| `/api/rag/delete-by-source` | POST | Delete RAG chunks by source label |
| `/api/payloads/generate` | POST | Generate payload asset (text, PDF, image, QR, audio) |
| `/api/payloads/list` | GET | List generated payload files |
| `/api/payloads/file/<path>` | GET | Download a generated payload file |
| `/evil/` | GET | Serve malicious HTML page for web-injection tests |

**Responsibilities**:
- Parse JSON/multipart requests, extract parameters with defaults
- Manage Flask session (user_id, mfa_verified)
- Initialize SQLite database on first request (`_ensure_db()`)
- Delegate all logic to `app.*` modules — no direct DB or LLM calls

**Frontend** (`api/templates/index.html`, `api/static/js/`, `api/static/css/`):
- Single HTML page with 8 tabbed panels, each targeting a different vulnerability class
- JavaScript modules: `app.js` (chat panels), `session.js` (auth flow), `documents.js` (upload/list), `rag.js` (RAG operations), `payloads.js` (payload generation)
- Sampling controls exposed per-panel: temperature, top_k, top_p, max_tokens, repeat_penalty
