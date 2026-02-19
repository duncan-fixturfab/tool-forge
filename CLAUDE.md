# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tool Forge is a web application for generating Fusion360 CNC tool libraries. Users can extract tool geometry from vendor URLs, PDFs, or text descriptions using Claude AI, then export optimized `.tools` files for direct import into Fusion360.

**Domain**: tools.fixturfab.com

## Common Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint

# Testing
npm test             # Run all Jest tests
npm run test:watch   # Watch mode
npx jest src/__tests__/feeds-speeds.test.ts   # Run a single test file
```

## Architecture

Next.js 14 App Router application with TypeScript. Path alias `@/` maps to `src/`.

### Route Groups
- `src/app/(auth)/` — Login/signup pages (public)
- `src/app/(dashboard)/` — Protected pages; middleware enforces authentication
- `src/app/api/` — API routes (no separate backend service — all server logic lives here)

### Key Library Modules (`src/lib/`)
- **agents/**: Claude AI parsing agents using tool_use for structured extraction. Each agent (tools, machines, materials, holders) has a corresponding `*-schemas.ts` with Zod schemas for validation. Pattern: call Claude with `tool_choice: { type: "tool", name: "..." }`, then validate the `tool_use` response block with Zod.
- **calculators/**: Feed and speed calculation engine (pure functions, unit-tested)
- **fusion360/**: `.tools` file format generator (JSZip-based)
- **supabase/**: Three clients — `client.ts` (browser), `server.ts` (server components/actions), `middleware.ts` (session refresh)
- **autodesk/**: Autodesk APS OAuth client and token management for Fusion360 integration

### Authentication
Supabase Auth with SSR middleware. The middleware in `src/middleware.ts` calls `updateSession()` on every request (except static assets) to keep sessions fresh. Protected routes redirect to `/login` when unauthenticated.

### AI Integration
Claude API is used server-side only (API routes and server actions). The current model in use is `claude-sonnet-4-20250514`. All agents use tool_use (structured output) rather than raw text generation — see `src/lib/agents/tool-parser-agent.ts` for the pattern.

## External Documentation References

- APS API Documentation: https://aps.autodesk.com/llms-full.txt

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
ANTHROPIC_API_KEY                 # Claude API key (server-side only)
AUTODESK_CLIENT_ID                # APS OAuth app credentials
AUTODESK_CLIENT_SECRET
AUTODESK_CALLBACK_URL             # Dev: http://localhost:3000/api/autodesk/callback
```

## Database

Supabase PostgreSQL. Migrations are in `supabase/migrations/` and must be run in order. Main tables: `machines`, `materials`, `machine_material_presets`, `tools`, `tool_libraries`, `library_tools`.

**NEVER reset the database.**

### Supabase Local Development
```bash
supabase start          # Start local instance (requires Docker)
supabase status         # Check service status
supabase db diff -f {migration_name}   # Create migration from schema changes
```

## Git & Branching Strategy

**Trunk:** `main` — always deployable, protected, requires PR review.

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, deps, CI |
| `hotfix/` | Urgent production fixes |

- All changes reach `main` through Pull Requests — no direct pushes
- Branch names: `<prefix>/<short-kebab-description>` (e.g. `feat/holder-import`)
- Use squash merges to keep `main` history clean
- Delete branches after merge
- Commit messages: imperative mood, concise summary line

## CI/CD

- **`claude-code-review.yml`**: Runs Claude automated PR review on every PR
- **`deploy.yml`**: Deploys to Vercel on merge to `main`
