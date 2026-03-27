# Living Spec: DVAIA — Damn Vulnerable AI Application

> **Last Updated**: 2026-03-27T12:00:00Z
> **Phase**: 🔵 Planning
> **Current Stage**: Intent & Requirements Questionnaire
> **Project Type**: Brownfield
> **Owner**: @developer
> **Drift Score**: 0%

## Current Status
- **Next Action**: Complete the Requirements Questionnaire below
- **Blockers**: None
- **Last Completed**: Brownfield reverse engineering (parallel analysis)

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
DVAIA is a deliberately vulnerable AI application for security education. The goal is to harden the codebase with configurable security controls, improve code quality, and add property-based testing — while preserving the educational vulnerability surface behind feature flags.

### Success Criteria
| Criteria | Target | Current | Status |
|----------|--------|---------|--------|
| 🎯 Security controls toggleable | All OWASP findings gated by flags | Hardcoded vulnerable | ⬚ |
| 📈 Property-based tests | PBT for core security modules | pytest only, no hypothesis | ⬚ |
| 📈 Code quality | server.py split into blueprints | 683-line monolith | ⬚ |

### Scope
**In Scope:** Security hardening (feature-flagged), code quality, PBT, server refactoring
**Out of Scope:** New features, UI redesign, migration away from Flask

---

## 2. Requirements

### ⚠️ QUESTIONNAIRE — ACTION REQUIRED

> **🛑 STOP: Complete this questionnaire before proceeding to Architecture.**
