# Database Workflow

Database schema and required baseline data are managed with Supabase migrations in
`supabase/migrations`.

## Local Validation

Install dependencies:

```sh
npm install
```

Validate migrations locally:

```sh
npm run db:validate
```

This starts the local Supabase stack, resets the local database from migrations,
and runs the Supabase database linter.

Stop the local Supabase stack when finished:

```sh
npm run db:stop
```

## Remote Supabase

Apply committed migrations to the linked Supabase project:

```sh
npm run db:push
```

Prefer migrations over manual dashboard changes. If a production hotfix is made
manually, backfill it into a migration before the next deploy.
