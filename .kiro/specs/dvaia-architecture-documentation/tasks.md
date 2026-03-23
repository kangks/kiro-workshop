# Tasks

## Task 1: Document Flask API Layer
- [ ] 1.1 Create the architecture documentation file with overview and Flask API section listing all routes from `api/server.py` with HTTP methods, URL paths, and purposes
- [ ] 1.2 Document `/api/chat`, `/api/agent/chat`, and `/api/chat-with-template` endpoint parameters
- [ ] 1.3 Document the frontend structure: single HTML page, 8 tabbed panels, and JS modules (`app.js`, `session.js`, `documents.js`, `rag.js`, `payloads.js`)
- [ ] 1.4 Write tests verifying route completeness (Property 1) and endpoint parameter documentation accuracy

## Task 2: Document LangChain Chat Orchestration
- [ ] 2.1 Document `handle_chat()` function signature, parameters, and context injection flow (document, URL, RAG prepended without sanitization)
- [ ] 2.2 Document multi-turn chat behavior (messages bypass context building) and `generate()` option mapping (temperature, top_k, top_p, repeat_penalty, num_predict)
- [ ] 2.3 Write tests verifying chat orchestration documentation accuracy against `app/chat.py` and `core/models.py`

## Task 3: Document ReAct Agent
- [ ] 3.1 Document all 6 agent tools with names, access levels, and behavior descriptions
- [ ] 3.2 Document the ReAct loop (LLM invoke → tool call → execute → append), max_steps (default 15, max 50), default model (`qwen3:0.6b` with `reasoning=True`), and lack of auth checks on tools
- [ ] 3.3 Write tests verifying agent tool completeness (Property 2) and ReAct configuration accuracy

## Task 4: Document Ollama LLM Integration
- [ ] 4.1 Document `get_llm()` factory, model ID resolution (strip `ollama:` prefix, fallback to `llama3.2`), two default models, and `.env` configuration loading
- [ ] 4.2 Write tests verifying LLM configuration defaults match documented values against `core/llm.py` and `core/config.py`

## Task 5: Document Qdrant Vector Database and RAG Pipeline
- [ ] 5.1 Document chunking strategy (500-char, 50-char overlap, paragraph preference, 8000-char limit), embedding service (Ollama, `nomic-embed-text`, lazy singleton), and `cosine_similarity()` utility
- [ ] 5.2 Document Qdrant point schema (UUID ID, float vector, payload fields, cosine distance), diverse search algorithm (200 candidates, group by source, top 10 per source), and ephemeral collection behavior
- [ ] 5.3 Write tests verifying RAG pipeline documentation accuracy against `app/retrieval.py`, `app/embeddings.py`, and `app/vector_store.py`

## Task 6: Document Authentication, Session, and MFA
- [ ] 6.1 Document SHA256 password hashing (no salt), Flask session fields (`user_id`, `mfa_verified`), MFA flow (mfa_codes then backup_codes fallback), seeded test data, and hardcoded secret key
- [ ] 6.2 Write tests verifying auth documentation accuracy against `app/auth.py`, `app/mfa.py`, and `app/config.py`

## Task 7: Document Management and URL Fetcher
- [ ] 7.1 Document upload flow (UUID prefix, extract text, insert row), supported extraction formats (PDF, DOCX, images/OCR, text, CSV), lazy extraction, and delete flow
- [ ] 7.2 Document URL fetcher: HTTP/HTTPS only, `curl_cffi` with Chrome impersonation, HTML stripping, no SSRF allowlist
- [ ] 7.3 Write tests verifying extraction format completeness (Property 3) and URL fetcher documentation accuracy

## Task 8: Document Payload Generator
- [ ] 8.1 Document all payload asset types (text, CSV, PDF, image, QR, audio synthetic, audio TTS) with generating modules and output formats
- [ ] 8.2 Document output directory configuration (`PAYLOADS_OUTPUT_DIR` defaults)
- [ ] 8.3 Write tests verifying payload type completeness (Property 4)

## Task 9: Document SQLite Schema and Docker Topology
- [ ] 9.1 Document all 5 SQLite tables with columns, types, constraints, defaults, `init_db()` seeding, and raw SQL usage
- [ ] 9.2 Document Docker Compose services (ollama, qdrant, dvaia), bridge network, auto-pull models, ephemeral Qdrant, and port mappings
- [ ] 9.3 Write tests verifying database schema completeness (Property 5) and Docker service completeness (Property 6)

## Task 10: Document Security Vulnerabilities, Error Handling, and Dependencies
- [ ] 10.1 Document all 10 intentional vulnerability classes with codebase locations and exploitation mechanisms
- [ ] 10.2 Document 5 error handling scenarios (Ollama unavailable, Qdrant unavailable, embedding failure, extraction failure, agent max-steps)
- [ ] 10.3 Document all Python packages from `requirements.txt`, external services (Ollama, Qdrant), and system dependencies (tesseract-ocr, ffmpeg)
- [ ] 10.4 Write tests verifying vulnerability completeness (Property 7) and dependency completeness (Property 8)
