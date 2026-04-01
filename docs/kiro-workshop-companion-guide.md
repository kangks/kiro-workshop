# Kiro Immersion Workshop — Companion Guide

> A non-technical-friendly supplement for the [Kiro Immersion Workshop](https://catalog.workshops.aws/kiro-immersion/en-US/20-steering/21-generate-steering).
> Designed for product managers, designers, and anyone new to AI-assisted development tools.

---

## What is Kiro?

Kiro is an AI-powered development environment (IDE) built by AWS. Think of it as a smart code editor that understands your project and can help write, review, and maintain code through conversation.

You don't need to be a developer to benefit from Kiro. Product managers can use it to turn requirements into structured specs, review generated code, and understand how features are being built.

Key concepts in plain language:

| Kiro Term | What It Means |
|-----------|---------------|
| Specs | Structured documents that turn your idea into requirements, design, and implementation tasks — like a project brief that the AI can execute on |
| Steering | Persistent rules and context you give Kiro so it always follows your team's conventions (think of it as a style guide for the AI) |
| Hooks | Automated actions that trigger when something happens — like auto-running tests every time a file is saved |
| Powers | Pre-packaged plugins that give Kiro specialized knowledge (e.g., how to deploy to AWS, how to use Figma designs) |
| Autopilot | A mode where Kiro works through tasks autonomously, with you reviewing the results |
| Chat | A conversational interface where you describe what you want and Kiro helps build it |

---

## Part 1: Installing Kiro (Step-by-Step)

### System Requirements

| Platform | Requirement |
|----------|-------------|
| macOS | Intel or Apple Silicon, latest security updates |
| Windows | Windows 10 or 11, 64-bit only |
| Linux | glibc 2.39+, e.g. Ubuntu 24+, Debian 13+, Fedora 40+ |

### Download and Install

1. Open your browser and go to [https://kiro.dev/downloads](https://kiro.dev/downloads)
2. Click the download button for your operating system (macOS, Windows, or Linux)
3. Open the downloaded file:
   - **macOS**: Open the `.dmg` file, drag Kiro to your Applications folder
   - **Windows**: Run the `.exe` installer and follow the prompts
   - **Linux**: Follow the instructions for your distribution
4. Launch Kiro from your Applications folder (macOS), Start Menu (Windows), or application launcher (Linux)

> **CLI alternative (macOS/Linux):** If you prefer the terminal, you can also install the Kiro CLI:
> ```
> curl -fsSL https://cli.kiro.dev/install | bash
> ```

### First Launch

When you open Kiro for the first time:

1. You'll be asked to sign in (see authentication section below)
2. Optionally import settings from VS Code if you already use it
3. Pick a theme (light or dark)
4. Allow shell integration so Kiro can run commands for you
5. You'll land on the Welcome page — open a project folder to get started

---

## Part 2: Setting Up Authentication

Kiro supports multiple sign-in methods. Choose the one that applies to you.

### Option A: Social Login (Quickest for Individuals)

Best for: Personal use, trying Kiro for the first time.

**GitHub:**
1. Click "Sign in with GitHub"
2. Enter your GitHub username/email and password
3. Click "Authorize kirodotdev"

**Google:**
1. Click "Sign in with Google"
2. Choose your Google account
3. Click "Continue"

> You get 500 bonus credits (usable within 30 days) when you first sign up with social login or Builder ID.

### Option B: AWS Builder ID (For AWS Users)

Best for: Individual developers who already use AWS.

1. Click "Login with AWS Builder ID"
2. Enter your email and click Next
3. Enter your password and click Sign in
4. Click "Allow access"

### Option C: AWS IAM Identity Center (IIC) — For Organizations

Best for: Teams and enterprises using AWS Organizations.

This is the method your workshop facilitator may ask you to use if your organization manages access centrally.

**What you need from your admin:**
- Your organization's **Start URL** (looks like `https://d-xxxxxxxxxx.awsapps.com/start`)
- The **AWS Region** where your identity directory is hosted

**Steps:**
1. In Kiro, click "Sign in with AWS IAM Identity Center"
2. Enter the **Start URL** provided by your admin
3. Enter the **Region** (e.g., `us-east-1`)
4. Click **Continue**
5. Your browser will open — complete the sign-in flow with your organization's credentials
6. Return to Kiro — you should now be authenticated

**Troubleshooting IIC:**
- Make sure you have the correct Start URL — ask your admin if unsure
- Ensure your browser allows pop-ups from Kiro
- If you see an error, check that your admin has granted you access to Kiro in the IAM Identity Center console
- For GovCloud users: your Start URL will contain `us-gov-home`

### Option D: External Identity Provider (Okta, Entra ID, etc.)

1. Click "Your organization"
2. Enter your work email
3. Click Continue
4. Complete sign-in through your organization's identity provider

---

## Part 3: Workshop Module — Generate Steering

This section complements the workshop module at:
`https://catalog.workshops.aws/kiro-immersion/en-US/20-steering/21-generate-steering`

### What is Steering? (Non-Technical Explanation)

Imagine you hire a new team member. On their first day, you'd give them:
- A product overview ("here's what we build and why")
- A tech stack document ("we use Python, React, and PostgreSQL")
- A project structure guide ("here's how our folders are organized")

**Steering files are exactly that — but for the AI.** They live in a `.kiro/steering/` folder in your project and are written in plain Markdown (like a simple text document with formatting).

### Why Steering Matters for Product Managers

- **Consistency**: Every piece of code Kiro generates follows your team's standards
- **Less back-and-forth**: You don't have to re-explain conventions in every conversation
- **Team alignment**: New team members (human or AI) get the same context
- **Quality control**: Steering acts as guardrails for AI-generated output

### Generating Foundation Steering Files

Kiro can auto-generate three foundational steering files by analyzing your project:

1. Open your project in Kiro
2. Look for the **Steering** section in the Kiro side panel (left sidebar)
3. Click **"Generate Steering Docs"** (or click the `+` button and select "Foundation steering files")
4. Kiro will create three files:

| File | Purpose | Non-Technical Analogy |
|------|---------|----------------------|
| `product.md` | Defines your product's purpose, users, and goals | Your product brief or PRD |
| `tech.md` | Documents frameworks, libraries, and tools | Your tech stack decision record |
| `structure.md` | Outlines file organization and naming conventions | Your project's filing system |

### Creating Custom Steering Files

You can add your own steering files for specific needs:

1. In the Steering section, click the `+` button
2. Choose workspace or global scope
3. Give it a descriptive name (e.g., `api-standards.md`, `security-policies.md`)
4. Write your guidance in plain Markdown
5. Optionally click **Refine** to have Kiro improve your instructions

**Example steering file for a product team:**

```markdown
# Product Requirements Standards

When generating features or specs:
- Always include user stories in the format: "As a [role], I want [feature], so that [benefit]"
- Include acceptance criteria for every requirement
- Flag any requirement that might impact data privacy or security
- Use simple, non-technical language in user-facing text
- Follow our brand voice guidelines: friendly, clear, professional
```

### Steering Inclusion Modes

| Mode | When It Loads | Best For |
|------|---------------|----------|
| `always` (default) | Every interaction | Core standards, tech stack, product overview |
| `fileMatch` | Only when working with matching files | Domain-specific rules (e.g., API standards only when editing API files) |
| `manual` | Only when you type `#filename` in chat | Specialized guides you need occasionally |
| `auto` | When your request matches the description | Context-heavy guidance that should load only when relevant |

---

## Part 4: Other Key Workshop Concepts

### Specs (Spec-Driven Development)

Specs turn a natural language prompt into a structured development plan:

1. **Requirements** — Kiro converts your idea into formal requirements using EARS notation (a structured way to write unambiguous requirements)
2. **Design** — Kiro analyzes your codebase and proposes architecture
3. **Tasks** — Kiro creates an ordered implementation plan with discrete tasks

**Why PMs should care:** Specs create a traceable path from requirement to code. You can review requirements before any code is written — just like reviewing a PRD before development starts.

To create a spec: Open the Kiro panel → click `+` under Specs → describe your feature in plain language.

### Hooks (Automated Workflows)

Hooks automate repetitive tasks. Examples:
- Auto-run linting when a file is saved
- Generate documentation after a spec task completes
- Run security checks before code is committed

**Why PMs should care:** Hooks enforce quality standards automatically — no one forgets to run tests or update docs.

To create a hook: Open the Kiro panel → Agent Hooks section → click `+` → describe what you want in natural language.

### Chat (Agentic Conversation)

Kiro's chat lets you describe what you want in natural language. You can:
- Ask questions about the codebase
- Request code changes
- Drop in images (UI mockups, architecture diagrams) for context
- Attach documents (PDFs, specs) for reference

**Autopilot mode** lets Kiro work through complex tasks autonomously, while **Supervised mode** lets you review each change before it's applied.

---

## Part 5: Pricing Quick Reference

| Plan | Price | Credits/Month | Overage |
|------|-------|---------------|---------|
| Free | $0 | 50 | — |
| Pro | $20/mo | 1,000 | $0.04/credit |
| Pro+ | $40/mo | 2,000 | $0.04/credit |
| Power | $200/mo | 10,000 | $0.04/credit |

New sign-ups with social login or Builder ID get **500 bonus credits** usable within 30 days.

Enterprise plans are available with centralized billing, SAML/SCIM SSO via IAM Identity Center, and usage analytics. See [kiro.dev/enterprise](https://kiro.dev/enterprise/) for details.

---

## Part 6: Glossary for Non-Technical Attendees

| Term | Definition |
|------|-----------|
| IDE | Integrated Development Environment — a software application for writing code (like Microsoft Word, but for code) |
| Markdown | A simple text formatting language using symbols like `#` for headings and `*` for bullets |
| Repository (Repo) | A folder that contains all the files for a project, usually tracked with version control |
| Git | A version control system that tracks changes to files over time |
| CLI | Command Line Interface — a text-based way to interact with your computer (the "terminal") |
| MCP | Model Context Protocol — a standard for connecting AI tools to external data sources and services |
| EARS Notation | Easy Approach to Requirements Syntax — a structured way to write requirements that reduces ambiguity |
| SSO | Single Sign-On — log in once and access multiple services |
| IAM | Identity and Access Management — AWS's system for controlling who can access what |
| IIC / IAM Identity Center | AWS's centralized identity service for managing user access across AWS accounts and applications |
| AIDLC | AI-Driven Development Life Cycle — the workflow of using AI agents throughout the software development process |

---

## Part 7: Tips for Non-Technical Workshop Attendees

1. **You don't need to write code.** Kiro can generate code from your descriptions. Focus on clearly describing *what* you want, not *how* to build it.

2. **Use specs as your superpower.** As a PM, you already think in requirements and acceptance criteria. Kiro's spec workflow is designed for exactly that kind of thinking.

3. **Steering files are your voice.** Write steering files in plain language describing your product standards, brand guidelines, or quality expectations. Kiro will follow them.

4. **Ask questions in chat.** You can ask Kiro things like "explain what this file does" or "what would break if we changed this feature?" — it's a great way to understand a codebase without reading code.

5. **Don't worry about breaking things.** Kiro works in your local environment. You can always undo changes. In Supervised mode, you approve every change before it's applied.

6. **Images work.** Drag a screenshot, wireframe, or whiteboard photo into the chat. Kiro can use visual context to guide its work.

---

## Appendix A: Kiro Powers — Extending Kiro's Capabilities

Powers are pre-packaged plugins that give Kiro specialized knowledge and tools for specific domains. They bundle documentation (steering), automation (hooks), and external tool connections (MCP servers) into a single installable package.

### How to Install a Power

1. Open Kiro IDE (version 0.7 or later)
2. Click the **Powers** icon in the sidebar
3. Browse available powers or click **"Add Custom Power" → "From GitHub"**
4. Paste the GitHub repository URL of the power
5. The power activates automatically based on your conversation context

### Living Spec Power

**Repository:** [github.com/tomasmihalyi/living-spec-power](https://github.com/tomasmihalyi/living-spec-power)

**Problem it solves:** In typical AI-assisted development, project context gets fragmented across dozens of files per feature — requirements in one place, architecture in another, progress tracking somewhere else. This makes it hard for both humans and AI to maintain a coherent picture of the project.

**What it does:** Consolidates all project documentation into a single, AI-maintainable specification file with seven sections aligned to the AI Development Life Cycle phases (Planning → Building → Operating). Instead of managing 10–20 files per feature, you get one evolving "living spec" that serves as the single source of truth.

**Key features (v2.0):**

| Feature | What It Means for You |
|---------|----------------------|
| Multi-Agent Analysis | Multiple specialized AI agents analyze your codebase in parallel for faster, more thorough understanding |
| Comprehension Gates | Checkpoints that verify the developer actually understands the spec before moving to the next phase — prevents "just let the AI do it" without understanding |
| Tiered Approvals | Low-risk changes (timestamps, status) auto-update; high-risk changes (requirements, architecture) require explicit approval |
| Domain Specialists | Automatically activates specialized guidance based on what you're working on (database, API, frontend, security, testing) |
| Drift Detection | Monitors how far your code has drifted from the spec and alerts you when they're out of sync |
| Spec Critic | Automated quality scoring that checks completeness, consistency, and quality of your spec |

**Three approaches:**

| Approach | Best For |
|----------|----------|
| Living Spec Only | MVPs, small teams — creates a single spec file |
| Living Spec + Kiro Specs | Multiple features, growing projects — orchestrates across feature specs |
| Kiro Specs Only | Teams that prefer formal EARS methodology with individual specs |

**Why PMs should care:** The Living Spec Power essentially creates a living PRD that stays in sync with the actual code. It prevents the common problem where documentation becomes stale the moment development starts.

### Other Notable Powers

Below is a selection of powers available in the [Kiro Powers catalog](https://kiro.dev/powers/) organized by what problem they solve:

#### Design & Prototyping

| Power | Problem It Solves |
|-------|-------------------|
| **Design to Code with Figma** | Bridges the gap between design and development — turns Figma designs into production-ready code and connects Figma components to code via Code Connect |
| **Miro Board Context for Codegen** | Uses Miro boards (architecture diagrams, UI flows, project logic) as the source of truth for code generation |

#### Deployment & Infrastructure

| Power | Problem It Solves |
|-------|-------------------|
| **Deploy web apps with Netlify** | Simplifies deploying React, Next.js, Vue apps to Netlify's global CDN with automatic builds |
| **Build full-stack apps with AWS Amplify** | Guides building full-stack apps with AWS Amplify Gen 2 — authentication, data models, storage, serverless functions |
| **Deploy Web Apps with ECS Express Mode** | Takes your container image and gives you back an HTTPS endpoint — simplest path to deploying on AWS |
| **Build AWS infrastructure with CDK** | Helps build well-architected AWS infrastructure following best practices |
| **Deploy infrastructure with Terraform** | Manages Infrastructure as Code with Terraform — registry providers, modules, policies |
| **AWS SAM** | Aids development with AWS Serverless Application Model for serverless applications |

#### Backend & Database

| Power | Problem It Solves |
|-------|-------------------|
| **Build a backend with Supabase** | Provides guided setup for Supabase's Postgres database, auth, storage, and real-time features |
| **Build applications with Aurora PostgreSQL** | Leverages Aurora PostgreSQL-specific best practices for database-backed applications |
| **Build a database with Neon** | Serverless Postgres with database branching and scale-to-zero for modern development |

#### AI & Agents

| Power | Problem It Solves |
|-------|-------------------|
| **Build an agent with Strands** | Guides building AI agents with the Strands Agent SDK using various LLM providers |
| **Build an agent with Amazon Bedrock AgentCore** | Helps build, deploy, and operate AI agents on AWS's agentic platform |

#### Security & Quality

| Power | Problem It Solves |
|-------|-------------------|
| **Snyk Secure at Inception** | Scans AI-generated code for security vulnerabilities and provides remediation guidance |
| **Checkmarx** | AI-powered security scanning for SAST, secrets, IaC, containers, and open source dependencies |
| **IAM Policy Autopilot** | Analyzes application code to auto-generate least-privilege IAM policies — reduces access troubleshooting time |

#### Observability & Monitoring

| Power | Problem It Solves |
|-------|-------------------|
| **AWS Observability** | Combines CloudWatch Logs, Metrics, Alarms, Application Signals, and CloudTrail for complete monitoring and troubleshooting |
| **Datadog Observability** | Queries logs, metrics, traces, and incidents from Datadog for production debugging |
| **Dynatrace Observability** | Queries logs, metrics, traces, and problems from Dynatrace for performance analysis |

#### Payments & Commerce

| Power | Problem It Solves |
|-------|-------------------|
| **Stripe Payments** | Guides building payment integrations — accepting payments, managing subscriptions, handling billing |
| **Checkout.com Global Payments** | Provides access to Checkout.com's API documentation for payments, customers, and disputes |

#### Migration & Modernization

| Power | Problem It Solves |
|-------|-------------------|
| **Plan and Migrate to Graviton** | Analyzes source code for compatibility with AWS Graviton (Arm64) processors and suggests required changes |
| **GCP to AWS Migration Advisor** | Assesses Google Cloud usage and recommends AWS equivalents with pricing comparison |
| **Crush tech debt with AWS Transform** | Performs code upgrades, framework migrations, and API/SDK migrations |

#### Testing

| Power | Problem It Solves |
|-------|-------------------|
| **API Testing with Postman** | Automates API testing and collection management — create workspaces, collections, and run tests programmatically |
| **ScoutQA Testing** | AI-powered exploratory testing for web applications with automated bug detection and accessibility audits |

---

## Appendix B: Useful Links

| Resource | URL |
|----------|-----|
| Kiro Homepage | [kiro.dev](https://kiro.dev/) |
| Download Kiro | [kiro.dev/downloads](https://kiro.dev/downloads/) |
| Documentation | [kiro.dev/docs](https://kiro.dev/docs/) |
| Pricing | [kiro.dev/pricing](https://kiro.dev/pricing/) |
| Powers Catalog | [kiro.dev/powers](https://kiro.dev/powers/) |
| Steering Docs | [kiro.dev/docs/steering](https://kiro.dev/docs/steering/) |
| Specs Docs | [kiro.dev/docs/specs](https://kiro.dev/docs/specs/) |
| Hooks Docs | [kiro.dev/docs/hooks](https://kiro.dev/docs/hooks/) |
| Authentication Guide | [kiro.dev/docs/getting-started/authentication](https://kiro.dev/docs/getting-started/authentication/) |
| Workshop | [catalog.workshops.aws/kiro-immersion](https://catalog.workshops.aws/kiro-immersion/en-US/20-steering/21-generate-steering) |
| Living Spec Power | [github.com/tomasmihalyi/living-spec-power](https://github.com/tomasmihalyi/living-spec-power) |
| Discord Community | [discord.gg/kirodotdev](https://discord.gg/kirodotdev) |
| Report a Bug | [github.com/kirodotdev/Kiro/issues](https://github.com/kirodotdev/Kiro/issues/new/choose) |
| Enterprise Info | [kiro.dev/enterprise](https://kiro.dev/enterprise/) |
