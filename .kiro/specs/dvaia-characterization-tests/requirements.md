# Requirements Document

## Introduction

This document specifies requirements for a characterization test suite covering the DVAIA (Damn Vulnerable AI Application). The tests document current behavior — including 10 intentional security vulnerabilities — as the "Red" phase of TDD Red-Green-Refactor. Each vulnerability gets a dedicated user story with acceptance criteria that assert the insecure behavior exists today, so future hardening (Green phase) can be validated by making these tests pass differently. The suite also covers all application layers (DB, Auth, MFA, Chat, Fetch, Documents, Embeddings, Retrieval, Vector Store, Agent, Core LLM, Core Models, API Routes) to establish a behavioral baseline before any refactoring.

## Glossary

- **Test_Suite**: The pytest-based characterization test collection under `DVAIA-Damn-Vulnerable-AI-Application/tests/`
- **Test_Infrastructure**: Shared fixtures in `conftest.py` providing isolated databases, Flask test clients, and mock factories
- **DB_Layer**: The `app/db.py` module handling SQLite schema, seed data, and CRUD operations
- **Auth_Layer**: The `app/auth.py` module handling SHA256 password hashing and login
- **MFA_Layer**: The `app/mfa.py` module handling MFA code verification and backup codes
- **Chat_Orchestrator**: The `app/chat.py` module building context from upload/url/rag before LLM invocation
- **Fetch_Layer**: The `app/fetch.py` module fetching URLs and stripping HTML
- **Documents_Layer**: The `app/documents.py` module handling file upload, text extraction, and lifecycle
- **Embeddings_Layer**: The `app/embeddings.py` module wrapping Ollama embedding calls
- **Retrieval_Layer**: The `app/retrieval.py` module handling RAG chunking, search, and diverse search
- **Vector_Store_Layer**: The `app/vector_store.py` module wrapping Qdrant client operations
- **Agent_Layer**: The `app/agent.py` module implementing a ReAct agent with 6 tools
- **Core_LLM**: The `core/llm.py` module providing a LangChain ChatOllama factory
- **Core_Models**: The `core/models.py` module providing the `generate()` function
- **API_Layer**: The `api/server.py` Flask application exposing all HTTP routes
- **Seed_Data**: The deterministic test data inserted by `init_db()`: user test/test, MFA code 123456, 3 backup codes, 3 secret agents
- **Mock_LLM**: A unittest.mock patch of `core.models.generate` returning deterministic responses
- **Mock_Qdrant**: A unittest.mock patch of `app.vector_store._get_client` returning a MagicMock
- **Mock_Embeddings**: A unittest.mock patch of `app.embeddings._get_embeddings` returning deterministic vectors
- **Mock_Fetch**: A unittest.mock patch of `curl_cffi.requests` in `app.fetch` returning controlled content
- **Red_Test**: A characterization test that documents current (potentially insecure) behavior as the expected outcome

## Requirements

### Requirement 1: Test Infrastructure

**User Story:** As a developer, I want shared pytest fixtures that provide isolated test databases, Flask test clients, and mock factories, so that every test runs in a reproducible environment without touching real external services.

#### Acceptance Criteria

1. WHEN a test requests the `db_path` fixture, THE Test_Infrastructure SHALL return a unique temporary SQLite file path under `tmp_path`
2. WHEN a test requests the `db_session` fixture, THE Test_Infrastructure SHALL create a SQLite database with all 5 tables (users, mfa_codes, backup_codes, documents, secret_agents) and Seed_Data, and patch `app.config.get_database_uri` to return the temporary path
3. WHEN a test requests the `flask_client` fixture, THE Test_Infrastructure SHALL return a Flask test client with `TESTING=True`, patched database, Mock_LLM, Mock_Qdrant, and Mock_Embeddings
4. WHEN a test requests the `authenticated_client` fixture, THE Test_Infrastructure SHALL return a Flask test client with an active session logged in as user test/test
5. WHEN a test requests the `mock_generate` fixture, THE Test_Infrastructure SHALL patch `core.models.generate` to return `{"text": "mock response", "thinking": ""}`
6. WHEN a test requests the `mock_qdrant_client` fixture, THE Test_Infrastructure SHALL patch `app.vector_store._get_client` with a MagicMock
7. WHEN a test requests the `mock_embeddings` fixture, THE Test_Infrastructure SHALL patch `app.embeddings._get_embeddings` with a MagicMock returning deterministic 768-dimensional vectors
8. WHEN a test requests the `mock_fetch` fixture, THE Test_Infrastructure SHALL patch `app.fetch.requests` (curl_cffi) with a MagicMock returning controlled content
9. THE Test_Infrastructure SHALL ensure that no unit test makes network calls to Ollama, Qdrant, or any external HTTP service
10. WHEN any test completes, THE Test_Infrastructure SHALL clean up temporary files, database connections, and mock state so no leakage occurs between tests
