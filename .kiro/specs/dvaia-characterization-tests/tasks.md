# Implementation Plan: DVAIA Characterization Tests

## Overview

Build a comprehensive security characterization test suite for the DVAIA application following TDD Red-Green-Refactor. Tests are organized by module: infrastructure first, then database layer, then app-layer modules, then core services, then API routes. RED tests assert desired secure behavior and will FAIL against the current vulnerable code — that is correct and expected. All external services (Ollama, Qdrant, curl_cffi) are mocked. Property-based tests use hypothesis.

## Tasks

- [ ] 1. Set up test infrastructure and configuration
  - [ ] 1.1 Create `DVAIA-Damn-Vulnerable-AI-Application/tests/conftest.py` with shared fixtures
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

  - [ ] 1.2 Create `DVAIA-Damn-Vulnerable-AI-Application/pytest.ini` or `pyproject.toml` pytest config
    - Register markers: `unit`, `integration`
    - Set default test path to `tests/`
    - Configure hypothesis settings (max_examples=100)
    - _Requirements: 1.9_

- [ ] 2. Checkpoint - Verify test infrastructure
  - Ensure conftest.py fixtures load without errors, ask the user if questions arise.

- [ ] 3. Database layer characterization tests (`tests/test_db.py`)
  - [ ] 3.1 Implement `TestInitDb` — schema creation and seed data validation
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

  - [ ] 3.3 Implement `TestInitDb` RED tests — seed data security assertions
    - Test seeded password_hash is bcrypt or argon2, NOT SHA256 hex digest — RED: currently SHA256, will FAIL
    - Test seeded MFA code is cryptographically random, NOT static "123456" — RED: currently static, will FAIL
    - Test seeded backup codes are cryptographically random, NOT static "backup1/backup2/backup3" — RED: currently static, will FAIL
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ] 3.4 Implement `TestUserCrud` — user CRUD operations
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

  - [ ] 3.6 Implement `TestDocumentCrud` — document CRUD operations
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

  - [ ] 3.8 Implement `TestSecretAgentCrud` — secret agent CRUD operations
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

- [ ] 4. Checkpoint - Verify database layer tests
  - Ensure all DB characterization tests pass (GREEN tests) and RED tests fail as expected, ask the user if questions arise.

- [ ] 5. Auth layer tests (`tests/test_auth.py`)
  - [ ] 5.1 Implement `TestPasswordHashing` — characterize current SHA256 behavior and RED secure assertions
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

  - [ ] 5.4 Implement `TestLogin` — login flow characterization
    - Test `login` with valid credentials (test/test) returns user dict with id, username, password_hash, role, created_at
    - Test `login` with wrong password returns None
    - Test `login` with non-existent username returns None
    - _Requirements: 3.6, 3.7, 3.8_

- [ ] 6. Fetch layer tests (`tests/test_fetch.py`)
  - [ ] 6.1 Implement `TestFetchUrlToText` — characterize current behavior and RED SSRF assertions
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
