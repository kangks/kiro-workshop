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

### Component 3: Ollama LLM Integration (`core/llm.py`, `core/models.py`, `core/config.py`)

**Purpose**: Factory layer that creates LangChain `ChatOllama` instances for any Ollama model. Centralizes model resolution, host configuration, and sampling parameter mapping.

**LLM Factory** (`core/llm.py`):

```mermaid
sequenceDiagram
    participant Caller as Chat / Agent
    participant Factory as get_llm()
    participant Config as core/config.py
    participant Ollama as ChatOllama

    Caller->>Factory: get_llm(model_id, timeout, **kwargs)
    Factory->>Config: get_default_model_id() [if model_id is None]
    Factory->>Factory: Strip "ollama:" prefix, default to "llama3.2"
    Factory->>Config: get_ollama_host()
    Factory->>Ollama: ChatOllama(model, base_url, timeout, **kwargs)
    Ollama-->>Caller: BaseChatModel instance
```

**Model Resolution**:
- Input formats: `"ollama:llama3.2"`, `"llama3.2"`, `""` (empty)
- Strips `ollama:` prefix (case-insensitive)
- Falls back to `"llama3.2"` if empty after stripping
- Two default models configured:
  - `DEFAULT_MODEL` = `"ollama:llama3.2"` — used for all chat panels
  - `AGENTIC_MODEL` = `"qwen3:0.6b"` — used for agentic panel (supports `reasoning=True` for CoT)

**Model Router** (`core/models.py`):
- `generate(prompt, model_id, options, messages)` — single entry point for non-agentic chat
- Maps request options to ChatOllama kwargs: `temperature`, `top_k`, `top_p`, `repeat_penalty`, `num_predict`/`max_tokens`
- Converts message dicts to LangChain `SystemMessage`/`HumanMessage`/`AIMessage`
- Returns `{"text": str, "thinking": ""}` (thinking field reserved but unused for standard chat)

**Configuration** (`core/config.py`):
- Loads `.env` via `python-dotenv` (lazy, on first access)
- Key environment variables: `DEFAULT_MODEL`, `AGENTIC_MODEL`, `OLLAMA_HOST`, `PORT`, `EMBEDDING_BACKEND`, `EMBEDDING_MODEL`
- All getters have sensible defaults; no required env vars for basic operation

### Component 4: Qdrant Vector Database (`app/vector_store.py`, `app/embeddings.py`, `app/retrieval.py`)

**Purpose**: RAG pipeline — embed text chunks, store vectors in Qdrant, and retrieve semantically similar content for context injection.

**RAG Pipeline**:

```mermaid
sequenceDiagram
    participant U as User / API
    participant R as Retrieval
    participant E as Embeddings
    participant V as Vector Store
    participant Q as Qdrant Server
    participant O as Ollama

    Note over U,Q: === Document Ingestion ===
    U->>R: add_document(source, text)
    R->>R: _chunk_text(text, 500 chars, 50 overlap)
    loop Each chunk
        R->>E: embed_text(chunk)
        E->>O: OllamaEmbeddings.embed_query(chunk)
        O-->>E: vector (float[])
        E-->>R: vector
        R->>V: add_point(source, content, vector)
        V->>V: _ensure_collection(dimension)
        V->>Q: upsert(PointStruct)
        Q-->>V: ok
    end
    R-->>U: chunks_added count

    Note over U,Q: === Semantic Search ===
    U->>R: search_diverse(query)
    R->>E: embed_text(query)
    E->>O: OllamaEmbeddings.embed_query(query)
    O-->>E: query_vector
    E-->>R: query_vector
    R->>V: search_with_scores(query_vector, limit=200)
    V->>Q: query_points(cosine similarity)
    Q-->>V: scored results
    V-->>R: hits with scores
    R->>R: Group by source, top 10 per source
    R-->>U: balanced chunk list
```

**Embeddings** (`app/embeddings.py`):
- Backend: Ollama only (via `langchain_ollama.OllamaEmbeddings`)
- Default model: `nomic-embed-text`
- Lazy initialization — singleton `_embeddings_ollama` created on first call
- `embed_text(str) → List[float]` for single strings
- `embed_texts(List[str]) → List[List[float]]` for batch embedding
- Includes `cosine_similarity()` utility (pure Python, no numpy)

**Chunking** (`app/retrieval.py`):
- Documents split into 500-character chunks with 50-character overlap
- Prefers paragraph boundaries (double newline split) before falling back to fixed-size windows
- Max 8000 characters embedded per chunk (truncated if longer)

**Vector Store** (`app/vector_store.py`):
- Lazy Qdrant client initialization (singleton `_client`)
- Collection: `rag_chunks` (configurable via `QDRANT_COLLECTION` env)
- Auto-creates collection on first `add_point()` with cosine distance
- Point IDs: UUID4 strings
- Payload per point: `{source, content, created_at}`
- `search_with_scores()` returns hits with similarity scores for diverse retrieval
- `list_all()` paginates via `scroll()` (100 points per page)
- `delete_by_source()` uses Qdrant filter selector for bulk deletion

**Diverse Search** (`app/retrieval.py → search_diverse()`):
- Fetches up to 200 candidates from Qdrant
- Groups by `source` field
- Takes top 10 per source to prevent a single large document from dominating results
- Final results sorted by score descending
