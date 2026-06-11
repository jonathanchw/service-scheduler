# Deployment

## Vercel

Use Vercel's default Next.js deployment settings.

Recommended settings:

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave empty/default

No `vercel.json` is needed yet.

## Environment Variables

Set these in Vercel before deploying:

```txt
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Service Scheduler
NEXT_PUBLIC_DEFAULT_LOCALE=es
NEXT_PUBLIC_SUPPORTED_LOCALES=es,en,pt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WHATSAPP_COUNTRY_CODE=54
```

Add these later when email notifications are implemented:

```txt
RESEND_API_KEY=
EMAIL_FROM=
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only if it is added later.
