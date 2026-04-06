# Kiro Immersion Workshop — Companion Guide

> A hands-on supplement for the [Kiro Immersion Workshop](https://catalog.workshops.aws/kiro-immersion/en-US/00-introduction).
> Covers installation, authentication, and a guided walkthrough of Spec-Driven Development (SDD) using the `micro-blogging` sample app.

---

## What is Kiro?

Kiro is an AI-powered development environment (IDE) built by AWS. It's a smart code editor that understands your project and helps write, review, and maintain code through conversation.

You don't need to be a developer to benefit from Kiro. Product managers can use it to turn requirements into structured specs, review generated code, and understand how features are being built.

| Kiro Term | What It Means |
|-----------|---------------|
| Specs | Structured documents that turn your idea into requirements, design, and implementation tasks — like a project brief that the AI can execute on |
| Steering | Persistent rules and context you give Kiro so it always follows your team's conventions (think of it as a style guide for the AI) |
| Hooks | Automated actions that trigger when something happens — like auto-running tests every time a file is saved |
| Powers | Pre-packaged plugins that give Kiro specialized knowledge (e.g., how to deploy to AWS, how to use Figma designs) |
| Autopilot | A mode where Kiro works through tasks autonomously, with you reviewing the results |
| Chat | A conversational interface where you describe what you want and Kiro helps build it |

---

## Part 1: Installing Kiro

### System Requirements

| Platform | Requirement |
|----------|-------------|
| macOS | Intel or Apple Silicon, latest security updates |
| Windows | Windows 10 or 11, 64-bit only |
| Linux | glibc 2.39+, e.g. Ubuntu 24+, Debian 13+, Fedora 40+ |

### Download and Install

1. Go to [https://kiro.dev/downloads](https://kiro.dev/downloads)
2. Click the download button for your operating system
3. Open the downloaded file:
   - macOS: Open the `.dmg` file, drag Kiro to your Applications folder
   - Windows: Run the `.exe` installer and follow the prompts
   - Linux: Follow the instructions for your distribution
4. Launch Kiro

> CLI alternative (macOS/Linux):
> ```bash
> curl -fsSL https://cli.kiro.dev/install | bash
> ```

### First Launch

1. Sign in (see authentication section below)
2. Optionally import settings from VS Code
3. Pick a theme (light or dark)
4. Allow shell integration so Kiro can run commands for you
5. Open a project folder to get started

---

## Part 2: Setting Up Authentication

### Option A: Social Login (Quickest)

GitHub:
1. Click "Sign in with GitHub"
2. Enter your credentials
3. Click "Authorize kirodotdev"

Google:
1. Click "Sign in with Google"
2. Choose your Google account
3. Click "Continue"

> You get 500 bonus credits (usable within 30 days) when you first sign up.

### Option B: AWS Builder ID

1. Click "Login with AWS Builder ID"
2. Enter your email and click Next
3. Enter your password and click Sign in
4. Click "Allow access"

### Option C: AWS IAM Identity Center (IIC) — For Organizations

What you need from your admin:
- Your organization's Start URL (looks like `https://d-xxxxxxxxxx.awsapps.com/start`)
- The AWS Region where your identity directory is hosted

Steps:
1. Click "Sign in with AWS IAM Identity Center"
2. Enter the Start URL
3. Enter the Region (e.g., `us-east-1`)
4. Click Continue
5. Complete the sign-in flow in your browser
6. Return to Kiro

Troubleshooting:
- Make sure you have the correct Start URL
- Ensure your browser allows pop-ups from Kiro
- For GovCloud users: your Start URL will contain `us-gov-home`

### Option D: External Identity Provider (Okta, Entra ID, etc.)

1. Click "Your organization"
2. Enter your work email
3. Click Continue
4. Complete sign-in through your organization's identity provider

---

## Part 3: The Micro-Blogging Sample App

The `micro-blogging` project is a Twitter/X-style social media platform. It's a 3-tier serverless application you'll use to learn Spec-Driven Development with Kiro.

### Architecture at a Glance

```
Browser → CloudFront → S3 (React SPA)
                ↓
         API Gateway (REST)
                ↓
         Lambda Functions (Node.js 22.x)
                ↓
         ┌──────────┬──────────┐
         │ Cognito   │ DynamoDB │
         │ (auth)    │ (data)   │
         └──────────┴──────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 4 |
| Backend | Node.js Lambda functions (plain JS) |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Auth | Cognito User Pool + JWT |
| Database | DynamoDB (5 tables) |
| Hosting | S3 + CloudFront |

### Core Features (already implemented)

- User registration and authentication
- Create, read, and like posts (280 char limit)
- Follow/unfollow users
- Feed with sorting (newest, popular) and pagination
- User profiles with bio and avatar

### Open the Project

```bash
# From the workshop repo root
# Open the micro-blogging folder in Kiro
```

---

## Part 4: Spec-Driven Development (SDD) with Kiro

SDD is Kiro's structured approach to building features. Instead of jumping straight into code, you define what you want through a three-phase process: Requirements → Design → Tasks.

### Why SDD Matters

- Creates a traceable path from requirement to code
- You review requirements before any code is written
- Reduces ambiguity through EARS notation (structured requirement syntax)
- Kiro generates implementation tasks from the design, so nothing is missed

### Step 1: Generate Steering Files

Steering files give Kiro persistent context about your project. The micro-blogging app already has steering files in `.kiro/steering/`:

| File | Purpose |
|------|---------|
| `product.md` | Product overview, core features, design language reference |
| `tech.md` | Tech stack, build system, common commands |
| `structure.md` | File organization, naming conventions, key patterns |

To generate your own (for a fresh project):
1. Open the Kiro side panel → Steering section
2. Click "Generate Steering Docs" (or `+` → "Foundation steering files")
3. Kiro analyzes your codebase and creates `product.md`, `tech.md`, `structure.md`

To add custom steering:
1. Click `+` in the Steering section
2. Give it a name (e.g., `api-standards.md`)
3. Write your guidance in Markdown
4. Optionally click "Refine" to have Kiro improve it

### Steering Inclusion Modes

| Mode | When It Loads | Best For |
|------|---------------|----------|
| `always` (default) | Every interaction | Core standards, tech stack |
| `fileMatch` | Only when working with matching files | Domain-specific rules |
| `manual` | Only when you type `#filename` in chat | Specialized guides |
| `auto` | When your request matches the description | Context-heavy guidance |

### Step 2: Create a Spec

A spec turns a natural language prompt into a structured development plan.

1. Open the Kiro panel → click `+` under Specs
2. Describe your feature in plain language, for example:

   > "Add a comments feature to the micro-blogging app. Users should be able to comment on posts, see comments on a post, and delete their own comments."

3. Kiro generates three documents:

| Document | What It Contains |
|----------|-----------------|
| `requirements.md` | Formal requirements using EARS notation — unambiguous, testable statements |
| `design.md` | Architecture analysis, component design, data models, API contracts |
| `tasks.md` | Ordered implementation plan with discrete, executable tasks |

4. Review each document. You can ask Kiro to refine requirements, adjust the design, or reorder tasks.

### Step 3: Execute Tasks

Once you're satisfied with the spec:

1. Click "Start Task" on the first task in `tasks.md`
2. Kiro works through the task in Autopilot mode (or Supervised mode if you prefer to review each change)
3. After each task completes, review the changes
4. Move to the next task

### The Living Spec (Optional Advanced Pattern)

The micro-blogging app includes a Living Spec at `.kiro/specs/00-micro-blogging-app.living.md`. This is a single evolving document that serves as the source of truth for the entire project, powered by the [Living Spec Power](https://github.com/tomasmihalyi/living-spec-power).

The Living Spec includes:
- Intent and problem statement
- Requirements questionnaire (answer before building)
- Architecture decisions
- Component map
- Technical debt register
- Decision log

It orchestrates individual Kiro specs for specific features. Think of it as a living PRD that stays in sync with the code.

---

## Part 5: Hands-On Exercise — Adding a Feature with SDD

### Exercise: Add Comments to the Micro-Blogging App

The DynamoDB Comments table already exists in the infrastructure but has no Lambda functions or UI.

#### 1. Review the Current State

Open the Living Spec (`.kiro/specs/00-micro-blogging-app.living.md`) and note:
- The Comments table exists but has no implementation (see Component Map)
- Q3 in the Requirements Questionnaire asks about implementing comments
- TD-012 notes zero test coverage

#### 2. Create a Spec for Comments

Open the Kiro panel → Specs → click `+`

Prompt:
> "Implement a comments feature for the micro-blogging app. Users should be able to add comments to posts, view all comments on a post, and delete their own comments. Follow the existing patterns: Lambda function per route, DynamoDB for storage, React components for UI. The Comments DynamoDB table already exists with a GSI."

#### 3. Review the Generated Spec

Check `requirements.md`:
- Are the requirements clear and testable?
- Do they cover edge cases (empty comments, character limits, unauthorized delete)?

Check `design.md`:
- Does the API design follow existing patterns (`/api/posts/{postId}/comments`)?
- Are the Lambda handlers consistent with existing ones?
- Does the frontend design match the existing component structure?

Check `tasks.md`:
- Are tasks ordered correctly (backend before frontend)?
- Are there tasks for error handling and edge cases?

#### 4. Execute the Tasks

Click "Start Task" on the first task and let Kiro implement it. Review each change before moving to the next task.

#### 5. Verify

After all tasks complete:
- Check that the backend Lambda handlers follow the `withAuth` middleware pattern
- Check that the frontend components match the design language (purple accent, rounded buttons)
- Test the feature locally with `yarn start:frontend`

---

## Part 6: Hooks — Automating Quality Checks

Hooks automate repetitive tasks. Here are practical examples for the micro-blogging app:

### Example: Lint on Save

```json
{
  "name": "Lint on Save",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.ts", "*.tsx"]
  },
  "then": {
    "type": "runCommand",
    "command": "yarn workspace frontend lint"
  }
}
```

### Example: Remind About Tests After Task Completion

```json
{
  "name": "Test Reminder",
  "version": "1.0.0",
  "when": {
    "type": "postTaskExecution"
  },
  "then": {
    "type": "askAgent",
    "prompt": "The task is complete. Check if there are corresponding tests for the changes made. If not, suggest what tests should be written."
  }
}
```

To create a hook: Kiro panel → Agent Hooks → click `+` → describe what you want.

---

## Part 7: Pricing Quick Reference

| Plan | Price | Credits/Month | Overage |
|------|-------|---------------|---------|
| Free | $0 | 50 | — |
| Pro | $20/mo | 1,000 | $0.04/credit |
| Pro+ | $40/mo | 2,000 | $0.04/credit |
| Power | $200/mo | 10,000 | $0.04/credit |

New sign-ups get 500 bonus credits usable within 30 days.

---

## Part 8: Glossary

| Term | Definition |
|------|-----------|
| IDE | Integrated Development Environment — a software application for writing code |
| Markdown | A simple text formatting language using symbols like `#` for headings and `*` for bullets |
| Repository (Repo) | A folder that contains all the files for a project, tracked with version control |
| Git | A version control system that tracks changes to files over time |
| CLI | Command Line Interface — a text-based way to interact with your computer |
| MCP | Model Context Protocol — a standard for connecting AI tools to external data sources |
| EARS Notation | Easy Approach to Requirements Syntax — a structured way to write unambiguous requirements |
| SDD | Spec-Driven Development — Kiro's workflow of Requirements → Design → Tasks before coding |
| TDD | Test-Driven Development — write tests first, then code to make them pass |
| Red-Green-Refactor | The TDD cycle: Red (failing test) → Green (make it pass) → Refactor (clean up) |
| SSO | Single Sign-On — log in once and access multiple services |
| IAM | Identity and Access Management — AWS's system for controlling access |
| Living Spec | A single evolving document that serves as the source of truth for a project |

---

## Part 9: Tips for Workshop Attendees

1. You don't need to write code from scratch. Kiro generates code from your descriptions. Focus on clearly describing what you want.

2. Use specs as your superpower. Think in requirements and acceptance criteria. Kiro's spec workflow is designed for exactly that.

3. Steering files are your voice. Write them in plain language describing your standards. Kiro will follow them.

4. Ask questions in chat. "Explain what this file does" or "What would break if we changed this?" are great ways to understand a codebase.

5. Don't worry about breaking things. Kiro works locally. You can always undo. In Supervised mode, you approve every change.

6. Images work. Drag a screenshot, wireframe, or whiteboard photo into chat for context.

7. Review before you approve. SDD gives you checkpoints at requirements, design, and tasks. Use them.

---

## Appendix A: Kiro Powers

Powers are pre-packaged plugins that give Kiro specialized knowledge. Install them from the Powers icon in the sidebar.

### By Category

| Category | Power | What It Does |
|----------|-------|-------------|
| Design | Design to Code with Figma | Turns Figma designs into production-ready code |
| Design | Miro Board Context | Uses Miro boards as source of truth for codegen |
| Deploy | Deploy with Netlify | Deploys React/Next.js/Vue apps to Netlify CDN |
| Deploy | AWS Amplify | Full-stack apps with Amplify Gen 2 |
| Deploy | ECS Express Mode | Container → HTTPS endpoint on AWS |
| Deploy | AWS CDK | Well-architected AWS infrastructure |
| Deploy | Terraform | Infrastructure as Code with Terraform |
| Deploy | AWS SAM | Serverless Application Model |
| Backend | Supabase | Postgres, auth, storage, real-time |
| Backend | Aurora PostgreSQL | Aurora-specific best practices |
| Backend | Neon | Serverless Postgres with branching |
| AI | Strands Agent SDK | Build AI agents with various LLM providers |
| AI | Bedrock AgentCore | Build and deploy agents on AWS |
| Security | Snyk | Scan AI-generated code for vulnerabilities |
| Security | Checkmarx | SAST, secrets, IaC, container scanning |
| Security | IAM Policy Autopilot | Auto-generate least-privilege IAM policies |
| Observability | AWS Observability | CloudWatch, Metrics, Alarms, Traces |
| Observability | Datadog | Logs, metrics, traces from Datadog |
| Testing | Postman | Automated API testing |
| Testing | ScoutQA | AI-powered exploratory testing |
| Payments | Stripe | Payment integrations |
| Migration | Graviton Migration | Arm64 compatibility analysis |

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
| Auth Guide | [kiro.dev/docs/getting-started/authentication](https://kiro.dev/docs/getting-started/authentication/) |
| Workshop | [catalog.workshops.aws/kiro-immersion](https://catalog.workshops.aws/kiro-immersion/en-US/00-introduction) |
| Living Spec Power | [github.com/tomasmihalyi/living-spec-power](https://github.com/tomasmihalyi/living-spec-power) |
| Discord | [discord.gg/kirodotdev](https://discord.gg/kirodotdev) |
| Report a Bug | [github.com/kirodotdev/Kiro/issues](https://github.com/kirodotdev/Kiro/issues/new/choose) |
| Enterprise | [kiro.dev/enterprise](https://kiro.dev/enterprise/) |
