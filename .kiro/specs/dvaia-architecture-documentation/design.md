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
