# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database
npx drizzle-kit push       # Push schema changes to database
npx drizzle-kit generate   # Generate migrations
npx drizzle-kit studio     # Open Drizzle Studio GUI
```

## Architecture

Mail Memories is a Next.js 16 App Router application that surfaces "on this day" email memories from Gmail. Users authenticate via Google OAuth, and the app fetches their sent emails from the same calendar day across past years.

### Core Flow

1. **Authentication**: `better-auth` handles Google OAuth with `gmail.readonly` scope. Tokens stored in PostgreSQL via Drizzle adapter.
2. **Session Check**: Server components call `auth.api.getSession()` with request headers to get the current user.
3. **Memory Fetching**: `lib/memories.ts` queries Gmail API for sent emails (`from:me`) matching today's month/day across the last 8 years.
4. **Token Refresh**: Access tokens are auto-refreshed when expired (60s buffer) using stored refresh tokens.

### Key Files

- `lib/auth.ts` - Server-side better-auth configuration with Google OAuth
- `lib/auth-client.ts` - Client-side auth utilities (React)
- `lib/memories.ts` - Gmail API integration, token refresh, memory fetching
- `db/schema.ts` - Drizzle schema (user, session, account, verification tables)
- `db/index.ts` - Database connection (auto-detects Neon serverless vs standard Postgres)

### Route Structure

- `/` - Landing page (different content for authenticated vs anonymous)
- `/login` - Login page (redirects to /memories if already authenticated)
- `/memories` - Protected feed showing today's memories
- `/timeline` - Protected timeline view with filtering and year comparison
- `/api/auth/[...all]` - Auth API routes handled by better-auth

### Environment Variables Required

```
DATABASE_URL              # PostgreSQL connection string
BETTER_AUTH_SECRET        # Auth encryption secret
BETTER_AUTH_BASE_URL      # Base URL for auth callbacks
GOOGLE_CLIENT_ID          # OAuth client ID
GOOGLE_CLIENT_SECRET      # OAuth client secret
NEXT_PUBLIC_APP_URL       # Public app URL (client-side)
```

## Styling

- Tailwind CSS 4 with custom CSS variables in `app/globals.css`
- Two Google fonts: Manrope (body) and Fraunces (display headings)
- Glass-panel aesthetic with custom glow effects (--glow-peach, --glow-mint, --glow-rose)
