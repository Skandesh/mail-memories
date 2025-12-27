# Mail Memories

Mail Memories is a Next.js MVP that resurfaces emails sent on this day in past
years. It uses Better Auth with Google OAuth and a Postgres database.

## Setup

1) Copy `.env.example` to `.env.local` and fill in the values.
2) Run migrations:

```bash
npx drizzle-kit push
```

3) Start the dev server:

```bash
npm run dev
```

## Notes

- The `/memories` page currently shows a sample feed. Real Gmail fetching will
  replace it once OAuth is wired with your client ID, secret, and scopes.
