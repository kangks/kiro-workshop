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

### Component 2: LangChain Orchestration (`app/chat.py`, `app/agent.py`, `core/models.py`)

**Purpose**: Bridges user requests to LLM inference. Two modes: simple chat (single/multi-turn with optional context injection) and agentic ReAct loop with tool calling.

**Chat Flow** (`app/chat.py → core/models.py → core/llm.py`):

```mermaid
sequenceDiagram
    participant S as Flask Server
    participant C as Chat Handler
    participant D as Document Manager
    participant F as URL Fetcher
    participant R as RAG Retrieval
    participant M as Model Router
    participant L as LLM Factory
    participant O as Ollama

    S->>C: handle_chat(prompt, context_from, ...)
    alt context_from == "upload"
        C->>D: get_document(document_id)
        D-->>C: extracted_text
    else context_from == "url"
        C->>F: fetch_url_to_text(url)
        F-->>C: page_text
    else context_from == "rag"
        C->>R: search_diverse(rag_query)
        R-->>C: chunks[]
    end
    C->>C: Prepend context to prompt (no sanitization)
    C->>M: generate(full_prompt, model_id, options)
    M->>L: get_llm(model_id, **kwargs)
    L->>O: ChatOllama.invoke(messages)
    O-->>L: AIMessage
    L-->>M: response
    M-->>C: {text, thinking}
    C-->>S: {text, thinking}
```

**Context injection** (vulnerable by design): Document text, URL content, or RAG chunks are prepended directly to the user prompt with labels like `"Context from document:\n{text}\n"`. No escaping or sanitization.

**Multi-turn**: When `messages` list is provided, it bypasses context building and sends the full conversation history directly to `generate()`.

**Agent Flow** (`app/agent.py`):

```mermaid
sequenceDiagram
    participant S as Flask Server
    participant A as Agent Runner
    participant L as LLM (with tools bound)
    participant O as Ollama
    participant T as Tool Functions
    participant DB as SQLite

    S->>A: run_agent(prompt, messages, tool_names, ...)
    A->>A: Build LangChain message history
    A->>L: llm.bind_tools(selected_tools)
    loop ReAct Loop (max_steps)
        A->>L: invoke(messages)
        L->>O: ChatOllama (reasoning=True)
        O-->>L: AIMessage + tool_calls + reasoning
        alt Has tool_calls
            loop Each tool call
                A->>T: tool.invoke(args)
                T->>DB: SQL query
                DB-->>T: results
                T-->>A: JSON string
            end
            A->>A: Append AIMessage + ToolMessages
            A->>A: Record thinking step
        else No tool_calls (final answer)
            A-->>S: {text, thinking, messages, tool_calls}
        end
    end
```

**6 Agent Tools** (all SQLite-backed, no auth checks):

| Tool | Access | Description |
|---|---|---|
| `list_users` | Read | All users (id, username, role, created_at) |
| `list_documents` | Read | All documents (id, filename, user_id, created_at) |
| `list_secret_agents` | Read | All secret agents (id, name, handler, mission) |
| `get_document_by_id` | Read | Single document with extracted_text (truncated to 5000 chars) |
| `delete_document_by_id` | Write | Delete document — no auth check (vulnerable by design) |
| `get_internal_config` | Read | Fake internal API key and config (red-team bait) |

**Responsibilities**:
- Convert `[{role, content}]` dicts to LangChain `HumanMessage`/`AIMessage`/`SystemMessage` objects
- Support tool subset selection via `tool_names` parameter
- Extract chain-of-thought from Ollama's `reasoning_content` / `message.thinking` fields
- Format ReAct steps into human-readable thinking trace for the UI side panel
