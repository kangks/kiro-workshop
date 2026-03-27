# Living Spec: DVAIA — Damn Vulnerable AI Application

> **Last Updated**: 2026-03-27T12:30:00Z
> **Phase**: 🔵 Planning
> **Current Stage**: Architecture Review
> **Project Type**: Brownfield
> **Owner**: @developer
> **Drift Score**: 0%

## Current Status
- **Next Action**: Review and approve Architecture (§3)
- **Blockers**: None
- **Last Completed**: Requirements Questionnaire (all 5 answered)

---

## 1. Intent

### Project Context (Brownfield)
| Aspect | Current State | Source |
|--------|---------------|--------|
| Architecture | Layered monolith (3-tier): Flask HTTP → app logic → core services | auto |
| Tech Stack | Python 3.11, Flask 3.x, LangChain + AWS Bedrock, pgvector, SQLite, S3 | auto |
| Key Dependencies | langchain-aws, boto3, psycopg2, curl_cffi, PyPDF2, Pillow, hypothesis | auto |
| Entry Points | `python -m api` (dev), `gunicorn api.server:app` (prod) | auto |
| Test Coverage | 17 test files, ~3,316 lines, pytest + mocks for all external services | auto |
| Security Posture | Deliberately vulnerable (OWASP LLM Top 10) — 5 critical, 5 high findings | auto |

### Problem Statement
DVAIA is a deliberately vulnerable AI application for LLM security workshops. All vulnerabilities must be preserved as-is — they are the teaching material. The goal is to add characterization tests (RED tests) that prove each vulnerability exists, add property-based tests for security-critical paths, and keep the codebase clean and well-documented for workshop participants.

### Success Criteria
| Criteria | Target | Current | Status |
|----------|--------|---------|--------|
| 🎯 RED tests for all vulnerabilities | Every OWASP finding has a failing-by-design test | Partial coverage | ⬚ |
| 📈 Property-based tests | PBT for security-critical paths (auth, RAG, agent) | No hypothesis tests | ⬚ |
| 📈 Workshop readiness | All vulns documented, reproducible, testable | Good README, partial tests | ⬚ |

### Scope
**In Scope:** RED characterization tests, property-based testing, test infrastructure, documentation
**Out of Scope:** Security fixes, server refactoring, connection pooling, UI changes

---

## 2. Requirements

### ⚠️ QUESTIONNAIRE — ACTION REQUIRED

> **🛑 STOP: Complete this questionnaire before proceeding to Architecture.**

#### Q1: Security Hardening Approach
**Question:** How should security fixes coexist with the deliberately vulnerable code?
**Options:** A) Feature flags per vulnerability B) Global "hardened mode" toggle C) Separate hardened branch
**Your Answer:** `A) Feature flags per vulnerability — each vuln gets its own env toggle for workshop demos`
**Status:** ✅ Answered

---

#### Q2: Priority Vulnerabilities
**Question:** Which vulnerability categories should be hardened first?
**Options:** A) Authentication (SHA-256 → bcrypt, session security) B) Input validation (SSRF, CSRF, upload limits) C) Agent tools (auth checks, human-in-the-loop) D) All simultaneously
**Your Answer:** `A) Authentication first — most visible before/after for workshop demos`
**Status:** ✅ Answered

---

#### Q3: Server Refactoring Scope
**Question:** How should the 683-line server.py be restructured?
**Options:** A) Flask Blueprints (auth, chat, documents, rag, payloads, agent) B) Minimal split (core vs payload routes) C) Keep as-is
**Your Answer:** `C) Keep as-is — no refactoring needed for workshop`
**Status:** ✅ Answered

---

#### Q4: Testing Strategy
**Question:** What testing approach for property-based tests?
**Options:** A) Hypothesis tests for all core modules B) Focus PBT on security-critical paths C) PBT only for new hardened code
**Your Answer:** `B) Security-critical paths — RED tests that prove vulnerabilities exist`
**Status:** ✅ Answered

---

#### Q5: Connection Management
**Question:** How should database connections be managed?
**Options:** A) Connection pooling B) Context managers with proper lifecycle C) Keep current pattern
**Your Answer:** `C) Keep current pattern`
**Status:** ✅ Answered

---

### Questionnaire Status
| Total | Answered | Ready to Proceed? |
|-------|----------|-------------------|
| 5 | 5 | ✅ Yes |

### Project-Level Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PR-001 | Security vulnerabilities gated behind configurable feature flags | HIGH | ⬚ |
| PR-002 | Property-based tests for security-critical code paths | HIGH | ⬚ |
| PR-003 | server.py refactored into Flask Blueprints | MEDIUM | ⬚ |
| PR-004 | Duplicated code extracted to shared utilities | LOW | ⬚ |
| PR-005 | Connection management improved (thread-safe) | MEDIUM | ⬚ |

### Related Kiro Specs
| Spec | Path | Phase | Description |
|------|------|-------|-------------|
| (none yet) | — | — | Kiro specs will be created per feature |

---

## 3. Architecture

### Approval Gate
> ⚠️ **APPROVAL REQUIRED** before Building phase.
> Status: ⬚ Pending

### System Overview
```
api/server.py (Flask routes — 25+ endpoints)
  ├── app/chat.py → core/models.py → core/llm.py (ChatBedrockConverse)
  ├── app/agent.py → core/llm.py + LangChain tools → app/db.py + boto3
  ├── app/auth.py → app/db.py (SQLite)
  ├── app/documents.py → app/db.py + boto3 (S3)
  ├── app/retrieval.py → app/embeddings.py + app/vector_store.py (pgvector)
  ├── app/fetch.py (curl_cffi — no SSRF allowlist)
  └── payloads/ (self-contained generators)
```

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| HTTP | Flask 3.x + Gunicorn | Existing, lightweight |
| LLM | LangChain + AWS Bedrock | AWS-native, multi-model |
| Embeddings | Amazon Titan v2 | AWS-native |
| Vector Store | PostgreSQL 16 + pgvector | RDS-compatible |
| App DB | SQLite | Simple, file-based |
| Storage | AWS S3 | Document uploads |
| Testing | pytest + hypothesis | TDD + property-based |

---

## 4. Implementation

### Phase Gate: Planning → Building
> - [ ] Intent complete
> - [ ] Questionnaire answered (all ✅)
> - [ ] Architecture approved
> - [ ] **Comprehension gate passed**

### Execution Plan
| Stage | Name | Goal | Status |
|-------|------|------|--------|
| 1 | Security Feature Flags | Configurable toggle for each vulnerability class | ⬚ |
| 2 | Server Refactoring | Split server.py into Flask Blueprints | ⬚ |
| 3 | Connection Management | Thread-safe DB connections | ⬚ |
| 4 | Property-Based Tests | Hypothesis tests for security-critical paths | ⬚ |
| 5 | Code Deduplication | Extract shared utilities | ⬚ |

### Component Map
| Component | Location | Description |
|-----------|----------|-------------|
| API Server | `api/server.py` | Flask routes (683 lines, needs splitting) |
| Auth | `app/auth.py` | Login, SHA-256 hashing (vulnerable) |
| Chat | `app/chat.py` | Chat orchestration with context injection |
| Agent | `app/agent.py` | ReAct agent with 9 tools (over-privileged) |
| DB | `app/db.py` | SQLite CRUD, schema, seed data |
| Documents | `app/documents.py` | Upload → S3, text extraction |
| Vector Store | `app/vector_store.py` | pgvector RAG storage |
| Retrieval | `app/retrieval.py` | RAG pipeline (chunking, diverse search) |
| Fetch | `app/fetch.py` | URL fetching (no SSRF protection) |
| Payloads | `payloads/` | Red-team payload generators |

### Technical Debt Register
| ID | Description | Trigger | Severity |
|----|-------------|---------|----------|
| TD-001 | server.py is 683-line monolith | Route additions | ⚠️ Medium |
| TD-002 | Duplicated `_messages_to_lc()` in agent.py and models.py | Message changes | ⚠️ Medium |
| TD-003 | Inconsistent connection patterns | Concurrency | ⚠️ Medium |
| TD-004 | `last_insert_rowid()` race condition in db.py | Concurrent writes | ⚠️ Medium |
| TD-005 | Broad exception swallowing | Debugging | 🟡 Low |
| TD-006 | hypothesis dependency unused | Testing gaps | 🟡 Low |
| TD-007 | Mixed Ollama/Bedrock references in docs | Doc drift | 🟡 Low |

---

## 5. Metrics

### Phase Gate: Building → Operating
> - [ ] All stages complete
> - [ ] Tests passing
> - [ ] **Comprehension gate passed**

### Technical Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Test-to-source ratio | ≥1.5:1 | 1.25:1 | ⬚ |
| PBT coverage | Core security modules | 0 | ⬚ |
| server.py line count | <100 per blueprint | 683 | ⬚ |

---

## 6. Decision Log

| Timestamp | Decision | Phase | Context | Outcome |
|-----------|----------|-------|---------|---------|
| 2026-03-27T12:00:00Z | Created Living Spec (Option B) | 🔵 | Brownfield modernization | Analysis complete |
| 2026-03-27T12:00:00Z | 3 parallel analysis agents | 🔵 | Reverse engineering | 5 critical, 5 high, 7 tech debt items |

---

## 7. Next Actions

### Current Focus
- [ ] **HIGH**: Complete the Requirements Questionnaire (§2)

### Backlog
- [ ] Create Kiro specs for each execution stage
- [ ] Design feature flag system for security controls

### Completed
- [x] Brownfield parallel analysis
- [x] Living Spec created and populated

---

## Comprehension Tracking

| Date | Gate | Score | Notes |
|------|------|-------|-------|
| - | - | - | - |
