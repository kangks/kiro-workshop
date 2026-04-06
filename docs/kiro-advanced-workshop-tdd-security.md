# Kiro Advanced Workshop — TDD, Red-Green-Refactor & Security Hardening

> For intermediate Kiro users who have completed the SDD basics with `micro-blogging`.
> This guide uses the `DVAIA-Damn-Vulnerable-AI-Application` to learn TDD with Red-Green-Refactor,
> custom steering for agent behavior, hooks for automated guardrails, and security-focused spec-driven development.

---

## Prerequisites

Before starting this workshop, you should:
- Have Kiro installed and authenticated (see the [Companion Guide](kiro-workshop-companion-guide.md))
- Understand Kiro basics: steering, specs, chat, and hooks
- Have completed at least one SDD exercise with the `micro-blogging` app
- Have Docker installed (for running DVAIA locally)

---

## What You'll Learn

1. How to create advanced steering files that control agent behavior in a brownfield codebase
2. How to use TDD with Red-Green-Refactor inside Kiro's spec workflow
3. How to write "RED tests" — tests that prove vulnerabilities exist (and fail if someone accidentally fixes them)
4. How to build hooks that act as automated guardrails
5. How to create Kiro skills for domain-specific knowledge (LLM security best practices)
6. How to use conditional steering (`fileMatch`) to trigger context-aware rules

---

## Part 1: Understanding the DVAIA Application

DVAIA (Damn Vulnerable AI Application) is a deliberately vulnerable LLM web application. Every vulnerability is intentional — they exist to teach security researchers how to find and exploit LLM application flaws per the OWASP Top 10 for LLM Applications.

### Architecture

```
┌──────────────────────────────────────────────┐
│              Client (Browser SPA)             │
│           Vanilla JS + HTML/CSS              │
└─────────────────────┬────────────────────────┘
                      │ HTTP (port 5000)
┌─────────────────────▼────────────────────────┐
│            api/server.py (Flask)              │
│         25+ REST endpoints                   │
├──────────────────────────────────────────────┤
│            Application Layer (app/)           │
│  auth.py │ chat.py │ agent.py │ documents.py │
│  mfa.py  │ fetch.py│ retrieval│ vector_store │
├──────────────────────────────────────────────┤
│              Core Layer (core/)               │
│  config.py │ llm.py │ models.py              │
└──────────────────────────────────────────────┘
       │          │          │          │
   SQLite    Bedrock     pgvector     S3
```

### Intentional Vulnerabilities (the product)

| OWASP Category | Location | What's Vulnerable |
|---------------|----------|-------------------|
| A02: Cryptographic Failures | `app/auth.py` | Unsalted SHA-256 password hashing |
| A07: Security Misconfiguration | `app/config.py` | Hardcoded SECRET_KEY |
| A07: Security Misconfiguration | `app/db.py` | Static test credentials, static MFA code `123456` |
| A10: SSRF | `app/fetch.py` | No URL allowlist — fetches any URL including internal IPs |
| LLM01: Prompt Injection | `app/chat.py` | Unsanitized context prepended to prompts |
| LLM01: Prompt Injection | `api/server.py` | Template injection via unescaped substitution |
| LLM03: Training Data Poisoning | `app/vector_store.py` | No input sanitization on RAG chunks |
| LLM06: Excessive Agency | `app/agent.py` | Over-privileged tools, no auth, no human-in-the-loop |
| A04: Insecure Design | `app/documents.py` | No file upload validation |
| A01: Broken Access Control | `api/server.py` | No CSRF protection |

The key insight: **the vulnerabilities ARE the product**. You don't fix them — you document them with tests.

### Running DVAIA

```bash
cd DVAIA-Damn-Vulnerable-AI-Application
docker-compose up -d
# Access at http://127.0.0.1:5000
# Login: test / test
# MFA code: 123456
```

---

## Part 2: Advanced Steering — Controlling Agent Behavior

In the `micro-blogging` workshop, you created basic steering files (`product.md`, `tech.md`, `structure.md`). Now you'll create steering that fundamentally changes how Kiro's agent behaves.

### 2.1 The AGENT.md — Defining Agent Roles

DVAIA's `.kiro/steering/AGENT.md` is the most important steering file. It defines:

1. A Prime Directive (what the agent must never do)
2. Agent Roles (specialized behaviors)
3. Protected files (files with intentional vulnerabilities)
4. A change workflow

Open `.kiro/steering/AGENT.md` and study its structure:

```markdown
---
inclusion: always
---

# DVAIA Workshop Agent — Vulnerability Preservation Protocol

## ⛔ PRIME DIRECTIVE — DO NOT FIX VULNERABILITIES

The vulnerabilities in this codebase ARE the product.

### Forbidden Actions
You MUST NOT, under any circumstances:
- Replace hashlib.sha256 with bcrypt or argon2
- Add CSRF tokens or CSRF protection
- Add SSRF allowlists
- Add input sanitization to RAG content
- Add auth checks to agent tools
...

## Agent Roles

### vulnerability-guardian
Primary role. Ensures no vulnerability is accidentally patched.

### tdd-orchestrator
Drives Red-Green-Refactor adapted for vulnerable-by-design code:
1. Red: Write a test that PASSES when the vulnerability EXISTS
2. Green: Write minimal code to make the test pass
3. Refactor: Clean up while keeping all tests green

### security-documenter
Documents vulnerabilities instead of fixing them.
```

#### Why This Matters

Without this steering, Kiro's natural instinct is to fix security issues. The AGENT.md overrides that instinct and teaches the agent a completely different workflow — one where vulnerabilities are preserved and documented through tests.

#### Exercise: Create Your Own AGENT.md

Try creating a steering file that defines agent roles for your own project. Think about:
- What should the agent always do? (e.g., "Always write tests first")
- What should the agent never do? (e.g., "Never modify the database schema directly")
- What specialized behaviors do you need? (e.g., "security-auditor", "performance-optimizer")

### 2.2 Conditional Steering with fileMatch

DVAIA uses a `vulnerability-protection.md` steering file that only activates when you touch protected files:

```markdown
---
inclusion: fileMatch
fileMatchPattern: "app/*.py,api/*.py,core/*.py,.gitignore"
---

# Vulnerability Protection — Triggered on Protected File Access

Before making ANY change to this file, verify:
1. Does your change alter any vulnerable behaviors?
2. Will your change add security hardening?
3. Could your change accidentally close an attack vector?

If YES → DO NOT MAKE THE CHANGE.
```

This is powerful because it only loads into context when relevant, saving tokens and keeping the agent focused.

#### Exercise: Create a Conditional Steering File

Create a steering file that activates only when working with test files:

```markdown
---
inclusion: fileMatch
fileMatchPattern: "tests/*.py"
---

# Test Writing Standards

When writing or modifying tests:
- Follow the Red-Green-Refactor cycle
- RED tests (vulnerability characterization) must PASS when the vulnerability exists
- GREEN tests (behavioral characterization) must PASS against current code
- Mock all external services (Bedrock, S3, pgvector, curl_cffi)
- Use pytest fixtures from conftest.py
```

### 2.3 The TDD Steering File

The `test-driven-development.md` steering file enforces TDD discipline:

```markdown
---
inclusion: always
---

# Test-Driven Development Standards

- Before implementing any feature or fixing any bug, write failing tests first.
- Follow the Red-Green-Refactor cycle:
  1. Red: Write a failing test that defines the desired behavior.
  2. Green: Write the minimal code to make the test pass.
  3. Refactor: Clean up the code while keeping tests green.
- Every spec task should have corresponding test coverage before it is marked complete.
- Run tests after each implementation change.
- Do not skip writing tests even for small changes.
```

This steering file ensures that every time you ask Kiro to implement something, it writes tests first.

---

## Part 3: TDD with Red-Green-Refactor in Kiro

### 3.1 What is Red-Green-Refactor?

The classic TDD cycle:

```
┌─────────┐     ┌─────────┐     ┌───────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR  │
│ (write  │     │ (make   │     │ (clean up │
│ failing │     │  it     │     │  keeping  │
│  test)  │     │  pass)  │     │  green)   │
└─────────┘     └─────────┘     └───────────┘
      ▲                               │
      └───────────────────────────────┘
```

In DVAIA, there's a twist: **RED tests prove vulnerabilities exist**. A RED test PASSES when the vulnerability is present and FAILS if someone accidentally fixes it.

### 3.2 Understanding RED Tests vs GREEN Tests

| Test Type | What It Asserts | Current State | After Hardening |
|-----------|----------------|---------------|-----------------|
| GREEN (characterization) | Current behavior is preserved | PASSES | PASSES |
| RED (security) | Desired secure behavior | FAILS | PASSES |

Example RED test — proves SHA-256 hashing is weak:

```python
def test_red_hash_password_uses_salted_hashing():
    """RED: hash_password should use bcrypt/argon2, not SHA-256.
    This test FAILS against current code (which uses SHA-256).
    It will PASS after security hardening."""
    from app.auth import hash_password
    h = hash_password("test")
    # SHA-256 produces a 64-char hex string
    # bcrypt/argon2 produces a longer string with embedded salt
    assert len(h) != 64, "hash_password still returns SHA-256 (64 hex chars)"
    assert not h == hashlib.sha256(b"test").hexdigest(), "hash is plain SHA-256"
```

Example GREEN test — proves current login works:

```python
def test_login_valid_credentials(db_session):
    """GREEN: login with test/test returns user dict."""
    from app.auth import login
    user = login("test", "test")
    assert user is not None
    assert user["username"] == "test"
    assert "id" in user
```

### 3.3 The DVAIA Spec: Characterization Tests

DVAIA includes a complete spec at `.kiro/specs/dvaia-characterization-tests/` with:

- `requirements.md` — 17 requirements covering every module, with RED and GREEN acceptance criteria
- `design.md` — Test architecture, component interfaces, mock strategies, correctness properties
- `tasks.md` — 20 implementation tasks with checkpoints

Study the spec to understand how TDD is structured in a real project:

1. Open `.kiro/specs/dvaia-characterization-tests/requirements.md`
2. Notice how each requirement has both GREEN criteria (current behavior) and RED criteria (desired secure behavior)
3. Open `tasks.md` and see how tasks alternate between writing tests and verifying them

### 3.4 Hands-On: Write Your First RED Test

#### Exercise: SSRF Protection RED Test

The `app/fetch.py` module fetches any URL without restriction — including internal IPs like `169.254.169.254` (AWS metadata endpoint). Write a RED test that proves this vulnerability exists.

1. Open Kiro chat and ask:

   > "Write a RED test for app/fetch.py that asserts fetch_url_to_text rejects URLs pointing to 169.254.x.x (cloud metadata). The test should FAIL against the current code because there's no SSRF protection. Mock curl_cffi so no real network calls are made."

2. Kiro will generate something like:

```python
import pytest
from unittest.mock import patch, MagicMock

def test_red_ssrf_rejects_metadata_url():
    """RED: fetch_url_to_text should reject cloud metadata URLs.
    FAILS against current code (no SSRF protection).
    PASSES after adding URL allowlist."""
    from app.fetch import fetch_url_to_text

    with patch("app.fetch.requests") as mock_requests:
        mock_resp = MagicMock()
        mock_resp.text = "sensitive-metadata"
        mock_resp.status_code = 200
        mock_requests.get.return_value = mock_resp

        result = fetch_url_to_text("http://169.254.169.254/latest/meta-data/")

        # If SSRF protection exists, this should return empty string
        # and NOT make a network call
        assert result == "", "SSRF: metadata URL was not blocked"
        mock_requests.get.assert_not_called()
```

3. Run the test — it should FAIL (proving the vulnerability exists):

```bash
cd DVAIA-Damn-Vulnerable-AI-Application
python -m pytest tests/test_fetch.py::test_red_ssrf_rejects_metadata_url -v
```

4. The test fails because `fetch_url_to_text` happily fetches the metadata URL. That's correct — the RED test documents the vulnerability.

### 3.5 Hands-On: The Full Red-Green-Refactor Cycle

Now let's do a complete cycle. We'll add a new non-security feature using TDD.

#### Exercise: Add a "list all documents with pagination" function

1. RED — Write the failing test first:

   Ask Kiro:
   > "Write a failing test for a new function `list_documents_paginated(user_id, page, per_page)` in app/db.py that returns paginated results. The function doesn't exist yet, so the test should fail with an ImportError or AttributeError."

2. GREEN — Implement the minimal code:

   Ask Kiro:
   > "Implement `list_documents_paginated(user_id, page, per_page)` in app/db.py with the minimal code to make the test pass. Use LIMIT/OFFSET on the SQLite query. Remember: do NOT add any security hardening."

3. REFACTOR — Clean up:

   Ask Kiro:
   > "Refactor the `list_documents_paginated` function for readability. Add type hints and a docstring. Keep all tests green. Do NOT change any security behavior."

---

## Part 4: Hooks as Automated Guardrails

DVAIA uses three hooks that work together to protect the vulnerable codebase while enabling TDD.

### 4.1 The Vulnerability Guard (preToolUse)

```json
{
  "name": "Vulnerability Guard",
  "version": "1.0.0",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["write"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "VULNERABILITY GUARD CHECK: You are about to write to a file in the DVAIA workshop codebase. This is a DELIBERATELY VULNERABLE application. Before proceeding, confirm: (1) Your change does NOT fix any intentional vulnerability. (2) Your change does NOT add security hardening. (3) All vulnerabilities remain exploitable after your change."
  }
}
```

This hook fires before every file write, reminding the agent to preserve vulnerabilities. It's a `preToolUse` hook on the `write` tool category.

### 4.2 The RED Test Reminder (postToolUse)

```json
{
  "name": "RED Test Verification Reminder",
  "version": "1.0.0",
  "when": {
    "type": "postToolUse",
    "toolTypes": ["write"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "POST-WRITE CHECK: You just modified a file. If you changed any file in app/, api/, or core/, you MUST run the RED test suite to verify all intentional vulnerabilities are still intact. If any RED test fails, your change accidentally patched a vulnerability — revert it immediately."
  }
}
```

This hook fires after every file write, reminding the agent to run RED tests.

### 4.3 The Git Checkpoint (preToolUse)

```json
{
  "name": "Git Checkpoint Before Changes",
  "version": "1.0.0",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["write"]
  },
  "then": {
    "type": "runCommand",
    "command": "git add -A && git diff --cached --quiet || git commit -m \"checkpoint: auto-save before agent changes\""
  }
}
```

This hook auto-commits before every write, so you can always roll back.

### 4.4 How the Three Hooks Work Together

```
Agent wants to write a file
    │
    ▼
[Git Checkpoint] → auto-commit current state
    │
    ▼
[Vulnerability Guard] → "Is this change safe? Does it preserve vulnerabilities?"
    │
    ▼
Agent writes the file
    │
    ▼
[RED Test Reminder] → "Run RED tests to verify vulnerabilities are intact"
```

#### Exercise: Create Your Own Hook

Create a hook that runs the test suite after every spec task completes:

1. Open the Kiro panel → Agent Hooks → click `+`
2. Describe: "After a spec task completes, run the pytest suite and report any failures"
3. Or create it manually in `.kiro/hooks/`:

```json
{
  "name": "Run Tests After Task",
  "version": "1.0.0",
  "when": {
    "type": "postTaskExecution"
  },
  "then": {
    "type": "runCommand",
    "command": "cd DVAIA-Damn-Vulnerable-AI-Application && python -m pytest tests/ -v --tb=short"
  }
}
```

---

## Part 5: Creating Kiro Skills for Domain Knowledge

Skills are reusable knowledge packages that Kiro can activate when needed. For DVAIA, you can create skills for LLM security best practices.

### 5.1 What Are Skills?

Skills live in `.kiro/skills/` (workspace-level) or `~/.kiro/skills/` (user-level). They're Markdown files containing domain-specific knowledge that Kiro loads on demand.

### 5.2 Exercise: Create an LLM Security Best Practices Skill

Ask Kiro in chat:

> "Create a Kiro skill file at `.kiro/skills/llm-security-best-practices.md` that contains best practices for securing LLM applications, covering the OWASP Top 10 for LLM Applications. Include practical guidance for: prompt injection prevention, RAG content sanitization, agent tool authorization, SSRF protection, and secure credential management."

Or create it manually:

```markdown
# LLM Application Security Best Practices

## OWASP Top 10 for LLM Applications

### LLM01: Prompt Injection
- Never concatenate untrusted input directly into prompts
- Use delimiter tokens to separate system instructions from user input
- Implement input validation and sanitization before LLM invocation
- Consider using Bedrock Guardrails for prompt attack detection

### LLM03: Training Data Poisoning / RAG Poisoning
- Sanitize all content before storing in vector databases
- Validate source metadata on RAG chunks
- Implement content integrity checks on retrieval
- Use separate vector collections for trusted vs untrusted content

### LLM06: Excessive Agency
- Apply least-privilege to all agent tools
- Require authentication context for every tool invocation
- Implement human-in-the-loop for destructive operations (delete, modify)
- Scope AWS clients to specific resources (no wildcard ARNs)
- Log all tool invocations with caller identity

### SSRF Protection
- Maintain an allowlist of permitted URL domains
- Block private/internal IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x)
- Resolve DNS before making requests to prevent DNS rebinding
- Use network-level controls (security groups, VPC endpoints)

### Credential Management
- Never hardcode secrets — use AWS Secrets Manager or Parameter Store
- Generate cryptographically random session keys
- Use bcrypt or argon2 for password hashing (never plain SHA-256)
- Rotate credentials regularly
- Use time-based or cryptographically random MFA codes
```

### 5.3 Using Skills in Chat

Once created, reference the skill in chat:

> "Using the LLM security best practices skill, review the `app/agent.py` file and list all violations of the Excessive Agency guidelines."

---

## Part 6: Putting It All Together — A Complete SDD + TDD Workflow

This section walks through the full workflow that DVAIA demonstrates: using Kiro's SDD to plan a test suite, then executing it with TDD discipline.

### 6.1 The Workflow

```
1. Reverse-Spec the Codebase
   └── Kiro analyzes DVAIA and generates architecture docs

2. Create a Spec for Characterization Tests
   ├── requirements.md — what to test (GREEN + RED)
   ├── design.md — test architecture, mocks, properties
   └── tasks.md — ordered implementation plan

3. Execute Tasks with TDD
   ├── Write test (RED or GREEN)
   ├── Run test (verify it fails/passes as expected)
   ├── Implement minimal code (if needed)
   ├── Run test again (verify state changed correctly)
   └── Refactor (keep tests green)

4. Hooks Enforce Discipline
   ├── Git checkpoint before every write
   ├── Vulnerability guard before every write
   └── RED test reminder after every write
```

### 6.2 Exercise: Create a New Spec for a Security Feature

Let's say you want to add rate limiting to the MFA endpoint (without actually fixing the vulnerability — just documenting what rate limiting should look like).

1. Create a new spec in Kiro:

   > "Create a spec for adding rate limiting documentation and RED tests to the MFA verification endpoint. The spec should: (1) Define requirements for rate limiting (max 5 attempts per 60 seconds per user). (2) Design the test approach using mocks. (3) Create tasks that write RED tests proving rate limiting doesn't exist, then document what the fix would look like in comments."

2. Review the generated spec — check that it doesn't propose actually implementing rate limiting (that would fix a vulnerability).

3. Execute the tasks — Kiro writes RED tests that fail because there's no rate limiting.

4. Verify — the RED tests fail, proving the vulnerability exists. The hooks confirm no vulnerability was accidentally patched.

### 6.3 The Living Spec

DVAIA includes a Living Spec at `.kiro/specs/00-dvaia.living.md` that orchestrates the entire project. It tracks:

- Current phase (Planning → Building → Operating)
- Governance rules (vulnerability preservation)
- Related Kiro specs (like the characterization tests spec)
- Strategy (comprehensive RED tests + property-based tests)

The Living Spec's `living-spec-maintenance.md` steering file includes a critical constraint:

> "DVAIA is a deliberately vulnerable LLM security workshop app. The Living Spec must NEVER include tasks, requirements, or decisions that would fix, patch, or harden any intentional vulnerability."

---

## Part 7: MCP Configuration for DVAIA

DVAIA's `.kiro/settings/mcp.json` can be configured with MCP servers for enhanced capabilities. Common additions for this workshop:

### Git MCP (for checkpoint commits)

The AGENT.md references using git MCP to commit before major changes. Configure it:

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "."],
      "disabled": false,
      "autoApprove": ["git_status", "git_log", "git_diff"]
    }
  }
}
```

This lets Kiro interact with git directly — checking status, viewing diffs, and creating commits as part of its workflow.

---

## Part 8: Summary of Advanced Kiro Concepts

| Concept | What You Learned | Where It's Used |
|---------|-----------------|-----------------|
| Agent Roles in Steering | Define specialized agent behaviors (vulnerability-guardian, tdd-orchestrator) | `.kiro/steering/AGENT.md` |
| Conditional Steering | `fileMatch` triggers context-aware rules only when touching specific files | `.kiro/steering/vulnerability-protection.md` |
| TDD Steering | Enforce Red-Green-Refactor discipline on every change | `.kiro/steering/test-driven-development.md` |
| RED Tests | Tests that prove vulnerabilities exist (pass = vuln present, fail = vuln fixed) | `tests/test_*.py` |
| preToolUse Hooks | Intercept agent actions before they happen (vulnerability guard) | `.kiro/hooks/vuln-guard.kiro.hook` |
| postToolUse Hooks | Trigger actions after agent writes (RED test reminder) | `.kiro/hooks/red-test-reminder.kiro.hook` |
| Git Checkpoint Hooks | Auto-commit before changes for rollback safety | `.kiro/hooks/git-checkpoint.kiro.hook` |
| Skills | Reusable domain knowledge (LLM security best practices) | `.kiro/skills/` |
| Living Spec | Single source of truth that orchestrates multiple Kiro specs | `.kiro/specs/00-dvaia.living.md` |
| Property-Based Tests | Hypothesis-driven tests that verify universal correctness properties | Design doc correctness properties |
| Spec-Driven TDD | Using SDD to plan test suites, then executing with TDD discipline | Full workflow |

---

## Part 9: Troubleshooting

### "Kiro keeps trying to fix vulnerabilities"

- Check that `AGENT.md` has `inclusion: always` in its frontmatter
- Verify the vulnerability-protection.md steering is present
- Make sure the vuln-guard hook is enabled
- In chat, remind Kiro: "Remember, this is a deliberately vulnerable app. Do not fix any vulnerabilities."

### "RED tests are passing when they shouldn't"

- A passing RED test means the vulnerability was accidentally fixed
- Check git log for recent changes to the protected files
- Revert to the last checkpoint commit
- Run the full test suite to identify which vulnerability was patched

### "Hooks aren't firing"

- Check that hook files are valid JSON in `.kiro/hooks/`
- Verify the `enabled` field is `true`
- Check the `when.type` matches the event you expect
- For `preToolUse`/`postToolUse`, verify `toolTypes` matches the tool category

### "Docker compose fails"

```bash
# Check if ports are in use
lsof -i :5000
lsof -i :5432

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

---

## Appendix A: DVAIA File Reference

| File | Purpose | Vulnerabilities |
|------|---------|----------------|
| `app/auth.py` | Password hashing, login | SHA-256 without salt |
| `app/config.py` | Environment config | Hardcoded SECRET_KEY, default DB creds |
| `app/db.py` | SQLite schema, CRUD, seed data | Static test creds, static MFA code |
| `app/fetch.py` | URL fetching | No SSRF protection |
| `app/chat.py` | Chat orchestration | Unsanitized context injection |
| `app/agent.py` | ReAct agent with 9 tools | Over-privileged, no auth, no HITL |
| `app/documents.py` | File upload/extraction | No validation |
| `app/vector_store.py` | Qdrant wrapper | No content sanitization |
| `app/retrieval.py` | RAG chunking/search | Unsanitized chunks to LLM |
| `app/mfa.py` | MFA verification | Static codes, no rate limiting |
| `api/server.py` | Flask routes | No CSRF, no cookie flags, template injection |

## Appendix B: OWASP References

| Resource | URL |
|----------|-----|
| OWASP Top 10 for LLM Applications | [owasp.org/www-project-top-10-for-large-language-model-applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) |
| OWASP Top 10 Web Applications | [owasp.org/www-project-top-10](https://owasp.org/www-project-top-10/) |
| LangChain Security Best Practices | [python.langchain.com/docs/security](https://python.langchain.com/docs/security) |
| Prompt Injection Primer | [simonwillison.net/2023/Apr/14/worst-that-can-happen](https://simonwillison.net/2023/Apr/14/worst-that-can-happen/) |

## Appendix C: Kiro Docs

| Resource | URL |
|----------|-----|
| Steering | [kiro.dev/docs/steering](https://kiro.dev/docs/steering/) |
| Specs | [kiro.dev/docs/specs](https://kiro.dev/docs/specs/) |
| Hooks | [kiro.dev/docs/hooks](https://kiro.dev/docs/hooks/) |
| Powers | [kiro.dev/powers](https://kiro.dev/powers/) |
