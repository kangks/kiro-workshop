# Living Spec: Micro Blogging App

> **Last Updated**: 2026-03-27T12:00:00Z
> **Phase**: 🔵 Planning
> **Current Stage**: Intent & Requirements
> **Project Type**: Brownfield
> **Owner**: @developer
> **Drift Score**: 0%

## Current Status
- **Next Action**: Complete Requirements Questionnaire below
- **Blockers**: None
- **Last Completed**: Brownfield analysis (multi-agent)

---

## 1. Intent

### Project Context (Brownfield)
| Aspect | Current State | Source |
|--------|---------------|--------|
| Architecture | Serverless 3-tier monorepo (React SPA → API Gateway → Lambda → DynamoDB) | auto |
| Tech Stack | React 18/TS + Vite (frontend), Node.js 22 plain JS Lambda (backend), CDK v2/TS (infra) | auto |
| Key Dependencies | react 18, react-router-dom 6, AWS SDK v3, aws-cdk-lib 2.94, uuid 9 | auto |
| Entry Points | `frontend/src/main.tsx`, `backend/src/functions/*/`, `infrastructure/lib/app-stack.ts` | auto |
| Auth | Cognito User Pool + Identity Pool, JWT via IdToken, custom `withAuth` middleware | auto |
| Database | 5 DynamoDB tables (Users, Posts, Likes, Comments, Follows) — PAY_PER_REQUEST | auto |
| Hosting | S3 + CloudFront (SPA), API Gateway REST (backend) | auto |

### Problem Statement
A Twitter/X-style micro-blogging platform where users create short-form posts (280 char limit), follow other users, like posts, and browse a feed. Currently deployed as a workshop/development project with several security and performance gaps identified during analysis.

### Success Criteria
| Criteria | Target | Current | Status |
|----------|--------|---------|--------|
| 🎯 Core features working | Auth, posts, likes, follows, feed | Functional | ✅ |
| 📈 Security posture | No critical vulnerabilities | 4 critical issues | ⬚ |
| 📈 Performance | Feed loads < 2s at scale | Table scan bottleneck | ⬚ |
| 📈 Test coverage | > 60% backend coverage | 0% | ⬚ |

### Scope
**In Scope:** User auth, posts CRUD, likes, follows, feed, user profiles
**Out of Scope:** Comments (table exists but no Lambda/UI), direct messages, media uploads, notifications

---

## 2. Requirements

### ⚠️ QUESTIONNAIRE - ACTION REQUIRED

> **🛑 STOP: Complete this questionnaire before proceeding to Architecture.**

#### Q1: Security Priority
**Question:** The analysis found 4 critical security issues (unsigned JWT verification, leaked error messages, committed credentials, no input sanitization). Should we prioritize fixing these before adding new features?
**Options:** A) Yes, fix all critical security issues first B) Fix JWT verification only, then continue features C) Accept risk for now, this is a workshop project
**Your Answer:** `_______________`
**Status:** ⬚ Unanswered

---

#### Q2: Performance Strategy
**Question:** The feed uses a full DynamoDB table scan and the frontend has an N+1 query problem (separate API call per post author). How should we address this?
**Options:** A) Add a GSI for feed queries + embed user info in post responses B) Add caching layer (API Gateway cache or DAX) C) Both A and B D) Acceptable for current scale
**Your Answer:** `_______________`
**Status:** ⬚ Unanswered

---

#### Q3: Comments Feature
**Question:** A Comments DynamoDB table exists with a GSI but there are no Lambda functions or UI for comments. Should we implement this?
**Options:** A) Yes, implement comments as next feature B) No, remove the unused table C) Keep table, implement later
**Your Answer:** `_______________`
**Status:** ⬚ Unanswered

---

#### Q4: Testing Strategy
**Question:** Backend has 0% test coverage (Jest is a devDependency but no tests exist). Playwright is configured for e2e but no tests exist. What's the testing priority?
**Options:** A) Unit tests for backend Lambda handlers first B) E2E tests for critical user flows first C) Both in parallel D) Skip testing for now
**Your Answer:** `_______________`
**Status:** ⬚ Unanswered

---

#### Q5: Backend Language
**Question:** Backend is plain JavaScript while frontend and infrastructure are TypeScript. Should we migrate?
**Options:** A) Migrate backend to TypeScript B) Keep as JavaScript C) TypeScript for new functions only
**Your Answer:** `_______________`
**Status:** ⬚ Unanswered

---

### Questionnaire Status
| Total | Answered | Ready to Proceed? |
|-------|----------|-------------------|
| 5 | 0 | ❌ No |

### Project-Level Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PR-001 | Users can register and authenticate via Cognito | HIGH | ✅ |
| PR-002 | Users can create posts (280 char limit) | HIGH | ✅ |
| PR-003 | Users can like posts (one like per user per post) | HIGH | ✅ |
| PR-004 | Users can follow/unfollow other users | HIGH | ✅ |
| PR-005 | Feed displays posts with sorting (newest/popular) and pagination | HIGH | ✅ |
| PR-006 | User profiles show bio, avatar, follower counts, and posts | MEDIUM | ✅ |
| PR-007 | JWT tokens must be cryptographically verified | CRITICAL | ⬚ |
| PR-008 | Error responses must not leak internal details | HIGH | ⬚ |
| PR-009 | Feed queries must not use full table scans | HIGH | ⬚ |

### Related Kiro Specs
| Spec | Path | Phase | Description |
|------|------|-------|-------------|
| (none yet) | - | - | Create Kiro specs for individual features as needed |

---

## 3. Architecture

### Approval Gate
> ⚠️ **APPROVAL REQUIRED** before Building phase.
> Status: ⬚ Pending

### System Overview
```
Browser → CloudFront → S3 (React SPA)
                ↓
         API Gateway (REST, CORS)
                ↓
         Lambda Functions (Node.js 22.x)
           ├── Auth: login, register (direct handlers)
           └── Protected: posts/users/* (withAuth middleware)
                ↓
         ┌─────────────┬──────────────┐
         │   Cognito    │   DynamoDB   │
         │  User Pool   │  5 tables    │
         │  + Identity  │  + GSIs      │
         └─────────────┴──────────────┘
```

### Key Decisions

#### Decision: Function-per-Route Lambda Pattern
- **Timestamp**: 2026-03-27T12:00:00Z
- **Context**: Backend architecture choice
- **Options**: 1) Monolithic Express Lambda 2) Function-per-route 3) Container-based
- **Choice**: Function-per-route
- **Rationale**: Independent scaling, least-privilege IAM per function, simpler deployment
- **Approval**: ✅ Existing

#### Decision: DynamoDB Table-per-Entity
- **Timestamp**: 2026-03-27T12:00:00Z
- **Context**: Data modeling approach
- **Options**: 1) Single-table design 2) Table-per-entity
- **Choice**: Table-per-entity (5 tables with GSIs)
- **Rationale**: Simpler to reason about for workshop context, PAY_PER_REQUEST billing
- **Approval**: ✅ Existing

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript + Vite 4 | Modern SPA stack, fast dev server |
| Routing | React Router v6 | Standard React routing |
| Styling | Plain CSS + CSS variables | No framework overhead, custom design system |
| Backend | Node.js 22.x Lambda (plain JS) | Serverless, no cold-start framework overhead |
| Auth | Cognito + custom JWT middleware | Managed auth service |
| Database | DynamoDB (PAY_PER_REQUEST) | Serverless, auto-scaling |
| API | API Gateway REST | Managed API layer with CORS |
| Hosting | S3 + CloudFront | Static SPA hosting with CDN |
| IaC | AWS CDK v2 (TypeScript) | Type-safe infrastructure |

---

## 4. Implementation

### Phase Gate: Planning → Building
> - [x] Intent complete
> - [ ] Questionnaire answered (all ✅)
> - [ ] Architecture approved
> - [ ] **Comprehension gate passed**

### Component Map
| Component | Location | Description |
|-----------|----------|-------------|
| App Shell | `frontend/src/App.tsx` | Router, layout, protected routes |
| Auth Context | `frontend/src/contexts/AuthContext.tsx` | Login/register/logout state, localStorage token |
| API Client | `frontend/src/services/api.ts` | Centralized fetch-based REST client |
| Auth Middleware | `backend/src/common/middleware.js` | `withAuth` HOF — JWT decode + DynamoDB user lookup |
| CDK Stack | `infrastructure/lib/app-stack.ts` | All AWS resources in single stack |
| Feed Page | `frontend/src/pages/Feed.tsx` | Post list with infinite scroll, sort, like |
| Create Post | `frontend/src/pages/CreatePost.tsx` | 280-char post creation form |
| Profile Page | `frontend/src/pages/Profile.tsx` | User profile with posts and follow actions |

### Technical Debt Register
| ID | Description | Severity | Trigger |
|----|-------------|----------|---------|
| TD-001 | 🔴 JWT not cryptographically verified in `withAuth` middleware — allows token forgery | Critical | Immediate |
| TD-002 | 🔴 Internal error messages leaked to API clients (`error.message` in responses) | Critical | Immediate |
| TD-003 | 🔴 Live credentials committed in `frontend/.env` | Critical | Immediate |
| TD-004 | 🔴 No input sanitization on user content (posts, profile fields) | Critical | Before public launch |
| TD-005 | 🟠 Feed uses full DynamoDB table scan (`ScanCommand`) | High | At scale |
| TD-006 | 🟠 N+1 query: frontend fetches user profile per post in feed | High | At scale |
| TD-007 | 🟠 Race conditions in like/follow (check-then-act without conditional writes) | High | Concurrent users |
| TD-008 | 🟠 No rate limiting on auth endpoints | High | Before public launch |
| TD-009 | 🟠 CORS wildcard `*` with credentials | High | Before public launch |
| TD-010 | 🟡 Duplicated post card rendering in Feed.tsx (~30 lines copy-paste) | Medium | Next refactor |
| TD-011 | 🟡 CORS headers duplicated 40+ times across handlers | Medium | Next refactor |
| TD-012 | 🟡 Zero test coverage (backend or e2e) | Medium | Before new features |
| TD-013 | 🟡 Debug `console.log` in production `api.ts` | Medium | Next cleanup |
| TD-014 | 🟡 Non-atomic multi-table writes in follow/like operations | Medium | Concurrent users |
| TD-015 | 🟢 No structured logging in backend (bare `console.error`) | Low | Operational maturity |
| TD-016 | 🟢 ErrorBoundary only logs to console, no external reporting | Low | Production readiness |
| TD-017 | 🟢 No caching layer for read-heavy paths | Low | At scale |

---

## 5. Metrics

### Phase Gate: Building → Operating
> - [ ] All stages complete
> - [ ] Tests passing
> - [ ] **Comprehension gate passed**

### Business Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Active users | TBD | - | ⬚ |
| Posts per day | TBD | - | ⬚ |

### Technical Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API latency (p99) | < 500ms | Unknown | ⬚ |
| Error rate | < 1% | Unknown | ⬚ |
| Test coverage (backend) | > 60% | 0% | ⬚ |
| Critical security issues | 0 | 4 | ⬚ |

---

## 6. Decision Log

| Timestamp | Decision | Phase | Context | Outcome |
|-----------|----------|-------|---------|---------|
| 2026-03-27T12:00:00Z | Created Living Spec | 🔵 | Brownfield analysis of existing micro-blogging workshop app | Multi-agent analysis completed |
| 2026-03-27T12:00:00Z | Selected Option B (Living Spec + Kiro Specs) | 🔵 | Multiple features expected, growing project | Living Spec orchestrates future Kiro specs |

---

## 7. Next Actions

### Current Focus
- [ ] **HIGH**: Answer the 5 Requirements Questionnaire questions above
- [ ] **HIGH**: Review auto-populated sections for accuracy

### Backlog
- [ ] Fix critical security issues (TD-001 through TD-004)
- [ ] Create Kiro spec for security hardening
- [ ] Create Kiro spec for performance improvements
- [ ] Create Kiro spec for comments feature (if approved)
- [ ] Add backend unit tests
- [ ] Extract shared response builder to reduce CORS duplication

### Blocked
None

### Completed
- [x] Brownfield multi-agent analysis
- [x] Living Spec creation

---

## Comprehension Tracking

| Date | Gate | Score | Notes |
|------|------|-------|-------|
| - | - | - | - |
