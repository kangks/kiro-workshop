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
