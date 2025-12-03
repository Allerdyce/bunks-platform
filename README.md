This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Admin Pricing Console

- Visit `/admin` (or click **Admin Login** in the footer) to reach the internal dashboard.
- Sign in with the seeded credentials (`ali@bunks.com` or `matt@bunks.com`, both using `PMbunks101!`). Configure the allowed addresses via the comma-separated `ADMIN_EMAILS` (or legacy `ADMIN_EMAIL`) and override the password with `ADMIN_PASSWORD` in `.env.local`.
- From the console you can:
	- Set weekday/weekend nightly rates, plus cleaning ($85) and service ($20) fees for every property in the database.
	- Add date-level overrides for special pricing or block dates entirely when needed.
	- Flip feature toggles (e.g., disable the Viator add-on marketplace at launch) from the **Feature toggles** panel.

All admin APIs require the session cookie that is issued during login and rely on `ADMIN_SESSION_SECRET` for signing.

> **Tip:** Run `npx prisma migrate dev` followed by `node prisma/seed.mjs` whenever the Prisma schema changes so the database includes the latest pricing fields.

## Email templates & sample sends

The `/admin/emails` gallery now renders every React Email template with fixture data and lets you send Postmark samples without touching production bookings. To add or update a template end-to-end:

1. **Create / update the component** under `src/emails/*` and keep props serializable so previews can render on the server.
2. **Add fixture props** in `src/lib/email/sampleData.ts` (the admin gallery and sample sends both use these helpers).
3. **Register the renderer** by mapping the slug to the component + fixture props inside `src/lib/email/templateRenderers.tsx`. This drives the gallery HTML, subject previews, and sample send metadata.
4. **Whitelist the slug** in `src/lib/email/sampleSenderConfig.ts` so the admin UI, API route, and CLI helper all treat it as sendable.
5. **Author the subject template** inside `src/lib/email/subjects.ts`. Placeholders like `{{propertyName}}` will render with your sample props, and sample sends automatically prefix the subject with `[Sample]` so they stand out in your inbox.
6. **Expose the trigger** via `EMAIL_TEMPLATES` (in `src/lib/email/catalog.ts`) so the gallery lists it with the right audience/category/status.
7. **Test locally**:
	 - Preview at [/admin/emails](http://localhost:3000/admin/emails) and click **Send sample**.
	 - Or run the CLI helper:

		 ```bash
		 npm run tsx scripts/send-email-sample.ts -- --template booking-confirmation --to you@example.com
		 ```

> **Security heads-up:** `.env` (or `.env.local`) contains live credentials (Postmark, Stripe, Neon, admin password). Keep that file out of version control and rotate any value that might have leaked.

## Prisma migrations with a local shadow DB

Neon rejects destructive operations during migration planning, so Prisma now uses a local PostgreSQL instance purely as the shadow database. To generate new migrations:

1. Install and start PostgreSQL 16 (one-time):

	```bash
	brew install postgresql@16
	brew services start postgresql@16
	/opt/homebrew/opt/postgresql@16/bin/createdb bunks_shadow
	```

2. Ensure `.env` (or `.env.local`) contains `SHADOW_DATABASE_URL="postgresql://work@localhost:5432/bunks_shadow"`.
3. Run the diff command described in [`docs/prisma-email-type-migration.md`](docs/prisma-email-type-migration.md) to emit a migration without touching the shared Neon database:

	```bash
	cd /Users/work/Desktop/bunks
	PRISMA_SHADOW_DATABASE_URL="postgresql://work@localhost:5432/bunks_shadow" \
	npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
	```

4. Commit the generated SQL and run `npx prisma generate` so TypeScript sees the new enums/tables.

See the detailed checklist in `docs/prisma-email-type-migration.md` for smoke tests and deployment notes.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
