# Project Structure

All source code lives under `kiro-workshop/`.

```
kiro-workshop/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React context providers (AuthContext)
│   │   ├── pages/               # Route-level page components
│   │   ├── services/            # API client (api.ts — all backend calls)
│   │   ├── types/               # TypeScript interfaces (User, Post)
│   │   ├── App.tsx              # Root component with routing
│   │   ├── App.css              # Global styles
│   │   └── main.tsx             # Entry point
│   ├── .env                     # Environment config (VITE_API_URL, Cognito IDs)
│   └── playwright.config.ts     # E2E test config
│
├── backend/                     # Lambda functions (plain JS)
│   └── src/
│       ├── common/
│       │   └── middleware.js     # Auth middleware (withAuth wrapper)
│       └── functions/
│           ├── auth/             # login.js, register.js
│           ├── posts/            # createPost.js, getPosts.js, likePost.js
│           ├── users/            # getProfile, updateProfile, follow/unfollow, checkFollowing
│           └── monitoring/       # emitCustomMetrics.js
│
├── infrastructure/              # AWS CDK (TypeScript)
│   └── lib/
│       └── app-stack.ts         # Single stack defining all AWS resources
│
├── DESIGN_LANGUAGE.md           # Full design system reference
└── package.json                 # Root workspace config
```

## Key Conventions
- Frontend pages go in `frontend/src/pages/`, reusable components in `frontend/src/components/`
- All API calls are centralized in `frontend/src/services/api.ts`
- TypeScript interfaces live in `frontend/src/types/`
- Each backend Lambda is a single JS file in its domain folder under `backend/src/functions/`
- Authenticated Lambda handlers use `exports.handler = withAuth(handler)` pattern
- Lambda functions receive env vars for table names (`POSTS_TABLE`, `USERS_TABLE`, etc.)
- All Lambda responses include CORS headers (`Access-Control-Allow-Origin: *`)
- Infrastructure is a single CDK stack in `infrastructure/lib/app-stack.ts`
