# Implementation Plan: DVAIA Characterization Tests

## Overview

Build a comprehensive security characterization test suite for the DVAIA application following TDD Red-Green-Refactor. Tests are organized by module: infrastructure first, then database layer, then app-layer modules, then core services, then API routes. RED tests assert desired secure behavior and will FAIL against the current vulnerable code — that is correct and expected. All external services (Ollama, Qdrant, curl_cffi) are mocked. Property-based tests use hypothesis.

## Tasks

- [x] 1. Set up test infrastructure and configuration
  - [x] 1.1 Create `DVAIA-Damn-Vulnerable-AI-Application/tests/conftest.py` with shared fixtures
    - Implement `db_path` fixture returning a unique temporary SQLite file path under `tmp_path`
    - Implement `db_session` fixture that creates all 5 tables with seed data and patches `app.config.get_database_uri`
    - Implement `flask_client` fixture returning Flask test client with `TESTING=True`, patched DB, Mock_LLM, Mock_Qdrant, Mock_Embeddings
    - Implement `authenticated_client` fixture returning a Flask test client logged in as test/test
    - Implement `mock_generate` fixture patching `core.models.generate` to return `{"text": "mock response", "thinking": ""}`
    - Implement `mock_qdrant_client` fixture patching `app.vector_store._get_client` with MagicMock
    - Implement `mock_embeddings` fixture patching `app.embeddings._get_embeddings` with MagicMock returning 768-dim vectors
    - Implement `mock_fetch` fixture patching `app.fetch.requests` (curl_cffi) with MagicMock
    - Ensure no unit test makes network calls to Ollama, Qdrant, or any external HTTP service
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [x] 1.2 Create `DVAIA-Damn-Vulnerable-AI-Application/pytest.ini` or `pyproject.toml` pytest config
    - Register markers: `unit`, `integration`
    - Set default test path to `tests/`
    - Configure hypothesis settings (max_examples=100)
    - _Requirements: 1.9_

- [x] 2. Checkpoint - Verify test infrastructure
  - Ensure conftest.py fixtures load without errors, ask the user if questions arise.

- [x] 3. Database layer characterization tests (`tests/test_db.py`)
  - [x] 3.1 Implement `TestInitDb` — schema creation and seed data validation
    - Test all 5 tables exist after `init_db()`
    - Test seeded user test with username "test" and role "user"
    - Test seeded MFA code for user_id 1
    - Test seeded backup codes for user_id 1
    - Test seeded 3 secret agents (Alex Reed/Shadow, Jordan Blake/Echo, Sam Chen/Ghost)
    - Test idempotent seeding (calling `init_db()` twice does not duplicate data)
    - _Requirements: 2.1, 2.2, 2.6, 2.7_

  - [ ]* 3.2 Write property test for init_db seed idempotence
    - **Property 1: init_db seed idempotence**
    - For any number of consecutive `init_db()` calls, DB contains exactly 1 user, 1 MFA code, 3 backup codes, 3 secret agents
    - **Validates: Requirement 2.7**

  - [x] 3.3 Implement `TestInitDb` RED tests — seed data security assertions
    - Test seeded password_hash is bcrypt or argon2, NOT SHA256 hex digest — RED: currently SHA256, will FAIL
    - Test seeded MFA code is cryptographically random, NOT static "123456" — RED: currently static, will FAIL
    - Test seeded backup codes are cryptographically random, NOT static "backup1/backup2/backup3" — RED: currently static, will FAIL
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 3.4 Implement `TestUserCrud` — user CRUD operations
    - Test `get_user_by_username` with existing username returns dict with keys id, username, password_hash, role, created_at
    - Test `get_user_by_username` with non-existent username returns None
    - Test `get_user_by_id` with valid id returns matching user dict
    - Test `create_user` inserts new user row and returns new id
    - Test `list_users` returns all users ordered by id ascending
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12_

  - [ ]* 3.5 Write property test for user CRUD round-trip
    - **Property 2: User CRUD round-trip**
    - For any valid username and password_hash, `create_user` then `get_user_by_id` returns matching data
    - **Validates: Requirements 2.10, 2.11**

  - [x] 3.6 Implement `TestDocumentCrud` — document CRUD operations
    - Test `insert_document` inserts new document row and returns new id
    - Test `get_document` with user_id filters by both document_id and user_id
    - Test `get_document` with user_id=None returns document regardless of ownership
    - Test `delete_document` with user_id deletes only matching document for that user
    - Test `delete_document` with user_id=None deletes document regardless of ownership
    - Test `list_documents_by_user` returns documents filtered by user_id ordered by created_at descending
    - Test `update_document_text` updates extracted_text column
    - _Requirements: 2.13, 2.14, 2.15, 2.16, 2.17, 2.18, 2.19_

  - [ ]* 3.7 Write property test for document CRUD round-trip
    - **Property 3: Document CRUD round-trip**
    - For any valid user_id, filename, file_path, extracted_text, `insert_document` then `get_document` returns matching data
    - **Validates: Requirement 2.13**

  - [x] 3.8 Implement `TestSecretAgentCrud` — secret agent CRUD operations
    - Test `list_secret_agents` returns all agents ordered by created_at ascending
    - Test `get_secret_agent` with valid id returns matching agent dict
    - Test `insert_secret_agent` inserts new agent row and returns new id
    - Test `update_secret_agent` updates name, handler, and mission
    - Test `delete_secret_agent` removes agent row and returns True
    - _Requirements: 2.20, 2.21, 2.22, 2.23, 2.24_

  - [ ]* 3.9 Write property test for secret agent CRUD round-trip
    - **Property 4: Secret agent CRUD round-trip**
    - For any valid name, handler, mission, `insert_secret_agent` then `get_secret_agent` returns matching data
    - **Validates: Requirements 2.21, 2.22**

- [x] 4. Checkpoint - Verify database layer tests
  - Ensure all DB characterization tests pass (GREEN tests) and RED tests fail as expected, ask the user if questions arise.

- [x] 5. Auth layer tests (`tests/test_auth.py`)
  - [x] 5.1 Implement `TestPasswordHashing` — characterize current SHA256 behavior and RED secure assertions
    - Test `check_password` with correct password returns True
    - Test `check_password` with wrong password returns False
    - RED: Test `hash_password` returns bcrypt or argon2 hash (not 64-char SHA256 hex) — will FAIL
    - RED: Test `hash_password` called twice with same input returns different outputs (salted) — will FAIL
    - RED: Test `hash_password` output does NOT equal `hashlib.sha256(password.encode()).hexdigest()` — will FAIL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write property test for salted hashing (RED)
    - **Property 5: hash_password uses salted hashing**
    - For any string password, output is bcrypt/argon2 (not SHA256), and two calls produce different outputs
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 5.3 Write property test for password check round-trip
    - **Property 6: Password check round-trip**
    - For any two strings p1 and p2, `check_password(hash_password(p1), p2)` returns True iff p1 == p2
    - **Validates: Requirements 3.4, 3.5**

  - [x] 5.4 Implement `TestLogin` — login flow characterization
    - Test `login` with valid credentials (test/test) returns user dict with id, username, password_hash, role, created_at
    - Test `login` with wrong password returns None
    - Test `login` with non-existent username returns None
    - _Requirements: 3.6, 3.7, 3.8_

- [x] 6. Fetch layer tests (`tests/test_fetch.py`)
  - [x] 6.1 Implement `TestFetchUrlToText` — characterize current behavior and RED SSRF assertions
    - Test non-http schemes (ftp://, file://) return empty string
    - Test HTML stripping removes script, style, and HTML tags
    - Test network error returns empty string
    - RED: Test URL pointing to 169.254.x.x is rejected — will FAIL
    - RED: Test URL pointing to 10.x.x.x is rejected — will FAIL
    - RED: Test URL pointing to 127.x.x.x is rejected — will FAIL
    - RED: Test URL pointing to 192.168.x.x is rejected — will FAIL
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.2 Write property test for SSRF protection (RED)
    - **Property 7: SSRF protection rejects private/internal IPs**
    - For any URL whose host falls in private/internal IP ranges, `fetch_url_to_text` returns empty string without network call
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 6.3 Write property test for non-http scheme rejection
    - **Property 8: Non-http schemes rejected by fetch**
    - For any URL not starting with http:// or https://, `fetch_url_to_text` returns empty string
    - **Validates: Requirement 4.5**

  - [ ]* 6.4 Write property test for HTML stripping
    - **Property 9: HTML stripping removes all tags**
    - For any HTML string, `_strip_html` returns a string containing no `<` or `>` characters
    - **Validates: Requirement 4.6**

- [x] 7. Checkpoint - Verify auth and fetch layer tests
  - Ensure all GREEN tests pass and RED tests fail as expected, ask the user if questions arise.

- [x] 8. Template injection and chat orchestration tests
  - [x] 8.1 Implement template injection RED tests in `tests/test_server.py` (`TestChatWithTemplate`)
    - RED: Test `_build_prompt_from_template` neutralizes template-breaking characters (`}}`, `{{`) — will FAIL
    - RED: Test `_build_prompt_from_template` escapes special characters before substitution — will FAIL
    - RED: Test `/api/chat-with-template` sanitizes user_input before constructing prompt — will FAIL
    - Test `/api/chat-with-template` with empty template returns HTTP 400
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.2 Write property test for template substitution sanitization (RED)
    - **Property 10: Template substitution sanitizes user input**
    - For any template with `{{user_input}}` and any user_input with template-breaking chars, constructed prompt does not contain raw injection payload
    - **Validates: Requirements 5.1, 5.2**

  - [x] 8.3 Implement context injection RED tests in `tests/test_chat.py` (`TestHandleChat`)
    - Test direct prompt (no context_from) passes prompt to `generate` without modification
    - Test messages list passes directly to `generate`, prompt ignored
    - RED: Test document context (context_from="upload") sanitizes document text before prepending — will FAIL
    - RED: Test URL context (context_from="url") sanitizes fetched content before prepending — will FAIL
    - RED: Test RAG context (context_from="rag") sanitizes retrieved chunks before prepending — will FAIL
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.4 Write property test for context injection sanitization (RED)
    - **Property 11: Context injection sanitization**
    - For any document/URL/RAG content containing prompt injection payloads, `handle_chat` sanitizes before prepending
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 9. Agent layer tests (`tests/test_agent.py`)
  - [x] 9.1 Implement agent tools authentication RED tests
    - RED: Test `list_users` tool rejects unauthenticated calls — will FAIL
    - RED: Test `list_documents` tool rejects unauthenticated calls — will FAIL
    - RED: Test `list_secret_agents` tool rejects unauthenticated calls — will FAIL
    - RED: Test `delete_document_by_id` verifies caller owns document before deleting — will FAIL
    - RED: Test any agent tool rejects calls without valid session — will FAIL
    - Test `run_agent` returns dict with keys text, thinking, messages, tool_calls
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test for agent tools auth (RED)
    - **Property 12: Agent tools reject unauthenticated calls**
    - For any agent tool, invoking without valid auth context results in error or refusal
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

  - [ ]* 9.3 Write property test for delete_document_by_id ownership (RED)
    - **Property 13: delete_document_by_id checks ownership**
    - For any document and any caller, `delete_document_by_id` verifies ownership before deleting
    - **Validates: Requirement 7.4**

  - [x] 9.4 Implement internal config protection RED tests
    - RED: Test `get_internal_config` does NOT include API key values in returned data — will FAIL
    - RED: Test `get_internal_config` rejects unauthenticated calls — will FAIL
    - _Requirements: 8.1, 8.2_

- [x] 10. Checkpoint - Verify template, chat, and agent layer tests
  - Ensure all GREEN tests pass and RED tests fail as expected, ask the user if questions arise.

- [x] 11. Secret key and MFA tests
  - [x] 11.1 Implement secret key RED tests in `tests/test_server.py` (`TestSecretKey`)
    - RED: Test `get_secret_key` without SECRET_KEY env var does NOT return "dev-secret-change-in-production" — will FAIL
    - RED: Test `get_secret_key` returns a cryptographically generated secret of at least 32 characters — will FAIL
    - _Requirements: 9.1, 9.2_

  - [x] 11.2 Implement MFA RED tests in `tests/test_mfa.py` (`TestMfaVerification`)
    - Test `verify_code` with invalid code returns False
    - RED: Test `verify_code` with static code "123456" is rejected — will FAIL
    - RED: Test backup code is consumed (deleted) after single use — will FAIL
    - RED: Test rate limiting after 5+ attempts within 60 seconds — will FAIL
    - RED: Test `get_backup_codes` returns cryptographically random codes, not static strings — will FAIL
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 11.3 Write property test for backup codes single-use (RED)
    - **Property 24: Backup codes are single-use**
    - For any valid backup code, after one successful verification, the same code fails on second use
    - **Validates: Requirement 10.3**

- [x] 12. Document upload validation tests (`tests/test_documents.py`)
  - [x] 12.1 Implement `TestExtractText` — text extraction characterization
    - Test `extract_text` with .txt file reads and returns content
    - Test `extract_text` with .csv file reads and returns content
    - Test `extract_text` with unknown extension returns empty string
    - Test `extract_text` with read error returns empty string
    - _Requirements: 11.4, 11.5, 11.6, 11.7_

  - [x] 12.2 Implement `TestSaveUpload` — upload characterization and RED validation assertions
    - Test `delete_document` removes file from disk and database row
    - Test `list_documents` returns documents for given user_id
    - RED: Test `save_upload` rejects disallowed file extensions (.exe, .sh, .php) — will FAIL
    - RED: Test `save_upload` rejects files exceeding 10MB size limit — will FAIL
    - RED: Test `save_upload` sanitizes filenames with path traversal (../../etc/passwd) — will FAIL
    - _Requirements: 11.1, 11.2, 11.3, 11.8, 11.9_

  - [ ]* 12.3 Write property test for disallowed file extensions (RED)
    - **Property 14: Upload rejects disallowed file extensions**
    - For any file with extension not in allowed list, `save_upload` rejects the upload
    - **Validates: Requirement 11.1**

  - [ ]* 12.4 Write property test for oversized files (RED)
    - **Property 15: Upload rejects oversized files**
    - For any file exceeding 10MB, `save_upload` rejects the upload
    - **Validates: Requirement 11.2**

  - [ ]* 12.5 Write property test for filename sanitization (RED)
    - **Property 16: Upload sanitizes filenames**
    - For any filename containing path traversal sequences, saved path contains no traversal characters
    - **Validates: Requirement 11.3**

  - [ ]* 12.6 Write property test for unknown extension text extraction
    - **Property 17: Unknown file extensions return empty text**
    - For any file path with extension not in supported set, `extract_text` returns empty string
    - **Validates: Requirement 11.6**

- [x] 13. RAG retrieval sanitization tests (`tests/test_retrieval.py`)
  - [x] 13.1 Implement retrieval characterization and RED sanitization tests
    - Test `add_document` splits text into chunks and stores each
    - Test `_chunk_text` returns chunks within size limit
    - Test `search` embeds query and returns content strings
    - Test `search_diverse` balances results across sources
    - Test `list_chunks` returns all stored chunks
    - Test `delete_chunks_by_source` removes matching chunks
    - RED: Test `add_chunk` sanitizes content containing prompt injection payloads — will FAIL
    - RED: Test `add_chunk` validates and sanitizes source parameter with path traversal — will FAIL
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ]* 13.2 Write property test for add_chunk content sanitization (RED)
    - **Property 18: add_chunk sanitizes content**
    - For any content with prompt injection payloads, `add_chunk` sanitizes before storing
    - **Validates: Requirement 12.1**

  - [ ]* 13.3 Write property test for add_chunk source validation (RED)
    - **Property 19: add_chunk validates source parameter**
    - For any source with path traversal or injection characters, `add_chunk` sanitizes before storing
    - **Validates: Requirement 12.2**

  - [ ]* 13.4 Write property test for chunk text size limit
    - **Property 20: Chunk text respects size limit**
    - For any non-empty text and chunk_size > 0, every chunk from `_chunk_text` has length ≤ chunk_size
    - **Validates: Requirement 12.4**

  - [ ]* 13.5 Write property test for diverse search balance
    - **Property 21: Diverse search balances across sources**
    - For any set of search results grouped by source, `search_diverse` returns at most top_k_per_source per source
    - **Validates: Requirement 12.6**

- [x] 14. Checkpoint - Verify MFA, documents, and retrieval tests
  - Ensure all GREEN tests pass and RED tests fail as expected, ask the user if questions arise.

- [x] 15. Embeddings layer characterization tests (`tests/test_embeddings.py`)
  - [x] 15.1 Implement embeddings characterization tests
    - Test `embed_text` with non-empty string returns list of floats from mocked model
    - Test `embed_text` with empty or whitespace-only string returns empty list
    - Test `embed_texts` with list of non-empty strings returns list of float vectors
    - Test `embed_texts` with empty list returns empty list
    - Test `cosine_similarity` with two equal-length non-zero vectors returns float in [-1.0, 1.0]
    - Test `cosine_similarity` with mismatched or empty vectors returns 0.0
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 15.2 Write property test for cosine similarity bounds
    - **Property 22: Cosine similarity is bounded**
    - For any two equal-length non-zero float vectors, `cosine_similarity` returns value in [-1.0, 1.0]
    - **Validates: Requirement 13.5**

  - [ ]* 15.3 Write property test for whitespace-only embedding
    - **Property 23: Whitespace-only text returns empty embedding**
    - For any string of only whitespace characters, `embed_text` returns empty list
    - **Validates: Requirement 13.2**

- [x] 16. Vector store layer characterization tests (`tests/test_vector_store.py`)
  - [x] 16.1 Implement vector store characterization tests
    - Test `add_point` with source, content, and non-empty vector calls Qdrant upsert and returns UUID string
    - Test `add_point` with empty vector raises ValueError
    - Test `search` with query vector calls Qdrant query_points and returns payload dicts without score
    - Test `search_with_scores` returns payload dicts including score field
    - Test `list_all` scrolls through all Qdrant points and returns dicts with id, source, content, created_at
    - Test `delete_by_source` calls Qdrant delete with source filter
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [-] 17. Core LLM and models characterization tests
  - [x] 17.1 Implement core LLM factory tests in `tests/test_llm.py`
    - Test `get_llm` with "ollama:" prefix strips prefix and creates ChatOllama with correct model name
    - Test `get_llm` without prefix creates ChatOllama using model_id directly
    - Test `get_llm` with None or empty model_id falls back to DEFAULT_MODEL
    - _Requirements: 15.1, 15.2, 15.3_

  - [-] 17.2 Implement core models generate tests in `tests/test_models.py`
    - Test `generate` with prompt string invokes LLM with HumanMessage and returns `{"text": str, "thinking": ""}`
    - Test `generate` with messages list converts to LangChain format and invokes LLM
    - Test `generate` with options (num_predict, temperature) passes through to LLM constructor
    - _Requirements: 16.1, 16.2, 16.3_

- [ ] 18. Checkpoint - Verify embeddings, vector store, LLM, and models tests
  - Ensure all characterization tests pass, ask the user if questions arise.

- [ ] 19. API route security contract tests (`tests/test_server.py`)
  - [~] 19.1 Implement `TestHealthAndModels` — basic route contracts
    - Test GET `/api/health` returns HTTP 200 with `{"status": "ok"}`
    - Test GET `/api/models` returns HTTP 200 with keys default, agentic_model, format, examples
    - _Requirements: 17.1, 17.2_

  - [~] 19.2 Implement `TestAuthRoutes` — login/logout/session contracts
    - Test POST `/api/login` with valid credentials returns HTTP 200 with ok, user_id, username, role
    - Test POST `/api/login` with missing fields returns HTTP 400
    - Test POST `/api/login` with invalid credentials returns HTTP 401
    - Test POST `/api/logout` clears session and returns HTTP 200
    - Test GET `/api/session` while logged in returns user object
    - Test GET `/api/session` while not logged in returns `{"user": null}`
    - _Requirements: 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

  - [~] 19.3 Implement `TestMfaRoute` — MFA route contracts
    - Test POST `/api/mfa` with valid code while logged in sets mfa_verified=True
    - Test POST `/api/mfa` with invalid code returns HTTP 401
    - Test POST `/api/mfa` while not logged in returns HTTP 401
    - _Requirements: 17.9, 17.10, 17.11_

  - [~] 19.4 Implement `TestChatRoute` — chat route contracts
    - Test POST `/api/chat` with prompt returns HTTP 200 with response and thinking
    - Test POST `/api/chat` without prompt or messages returns HTTP 400
    - RED: Test POST `/api/chat` without authentication requires auth — will FAIL
    - RED: Test POST `/api/agent/chat` without authentication returns HTTP 401 — will FAIL
    - _Requirements: 17.12, 17.13, 17.14, 17.15_

  - [~] 19.5 Implement `TestDocumentRoutes` — document route contracts
    - Test POST `/api/documents/upload` with file returns HTTP 200 with document_id
    - Test POST `/api/documents/upload` without file returns HTTP 400
    - Test GET `/api/documents` returns HTTP 200 with documents list
    - Test GET `/api/documents/<id>` returns document with id, filename, extracted_text, created_at
    - Test DELETE `/api/documents/<id>` while not logged in returns HTTP 401
    - _Requirements: 17.19, 17.20, 17.21, 17.22, 17.23_

  - [~] 19.6 Implement `TestRagRoutes` — RAG route contracts
    - Test GET `/api/rag/search` with empty query returns `{"chunks": []}`
    - Test GET `/api/rag/chunks` returns HTTP 200 with chunks list
    - RED: Test POST `/api/rag/chunks` without authentication returns HTTP 401 — will FAIL
    - Test POST `/api/rag/delete-by-source` while not logged in returns HTTP 401
    - _Requirements: 17.24, 17.25, 17.16, 17.26_

  - [~] 19.7 Implement `TestPayloadRoutes` — payload route contracts
    - Test POST `/api/payloads/generate` with asset_type="text" returns HTTP 200 with path and relative_path
    - Test POST `/api/payloads/generate` with unknown asset_type returns HTTP 400
    - Test GET `/api/payloads/list` returns HTTP 200 with files list
    - _Requirements: 17.27, 17.28, 17.29_

  - [~] 19.8 Implement RED tests for CSRF and secure cookies
    - RED: Test any state-changing POST endpoint verifies CSRF token — will FAIL
    - RED: Test session cookie includes HttpOnly, Secure, and SameSite flags — will FAIL
    - _Requirements: 17.17, 17.18_

  - [ ]* 19.9 Write property test for CSRF protection (RED)
    - **Property 25: CSRF protection on state-changing endpoints**
    - For any state-changing POST endpoint, calling without valid CSRF token is rejected
    - **Validates: Requirement 17.17**

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all GREEN characterization tests pass and all RED security tests fail as expected, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design.md using hypothesis
- RED tests assert desired secure behavior — they FAIL against current vulnerable code and PASS after security fixes
- All external services (Ollama, Qdrant, curl_cffi) are mocked in unit tests
- Tests live in `DVAIA-Damn-Vulnerable-AI-Application/tests/`
- This plan is WRITE-ONLY: no implementation fixes are applied in this phase
