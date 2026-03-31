# Tech Stack & Build System

## Monorepo Structure
Yarn workspaces monorepo with three packages: `frontend`, `backend`, `infrastructure`.
Root package name: `micro-blogging-app`.

## Frontend
- React 18 + TypeScript (strict mode)
- Vite 4 for dev server and bundling
- React Router v6 for routing
- Plain CSS (no CSS framework — uses CSS variables and custom classes)
- ESLint with `@typescript-eslint` and `react-hooks` plugins
- Playwright for e2e testing (tests in `frontend/tests/e2e/`)
- Environment variables prefixed with `VITE_` (accessed via `import.meta.env`)

## Backend
- Node.js Lambda functions written in plain JavaScript (CommonJS `require`)
- AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-cognito-identity-provider`)
- `uuid` for ID generation
- Custom auth middleware (`withAuth` wrapper) that decodes JWT and resolves user from DynamoDB
- No transpilation step — JS files are copied directly to `dist/`
- Jest available for testing (devDependency)

## Infrastructure
- AWS CDK v2 (TypeScript)
- Services: Cognito (auth), DynamoDB (data), API Gateway (REST), Lambda (compute), S3 + CloudFront (frontend hosting)
- Stack name: `MicroBloggingAppStack`
- Lambda runtime: Node.js 22.x
- DynamoDB tables: Users, Posts, Likes, Comments, Follows (all PAY_PER_REQUEST)
- Lambda packages deployed from `backend/dist/lambda-packages/{functionName}.zip`

## Common Commands

All commands run from `kiro-workshop/`:

```bash
# Frontend
yarn start:frontend          # Start Vite dev server
yarn build:frontend          # TypeScript check + Vite build
yarn workspace frontend lint # ESLint

# Backend
yarn build:backend           # Copy src to dist (no transpile)

# Infrastructure
yarn deploy:infra            # CDK deploy
yarn workspace infrastructure diff  # CDK diff

# Full deploy (build + deploy infra + deploy frontend + invalidate CDN)
yarn deploy

# E2E tests (from frontend/)
npx playwright test          # Run all e2e tests
npx playwright test --ui     # Interactive UI mode
```
