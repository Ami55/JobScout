# Publish JobScout on GitHub and Vercel

## 1. Upload the project to GitHub

1. Unzip `ami-job-scout-vercel.zip`.
2. Create a **private** GitHub repository, such as `ami-job-scout`.
3. Upload the contents of the extracted folder. `package.json`, `vercel.json`, `app`, and `lib` must be at the repository root, not inside an extra nested folder.
4. Include the dotfiles `.gitignore` and `.env.example`. Never upload real secrets or a populated `.env.local`.

## 2. Create the Vercel project

In Vercel, choose **Add New → Project → Import Git Repository**. Select the repository. Framework: **Next.js**. Leave the build command and output directory at their defaults. Use Node.js **24.x**.

## 3. Connect a database

Create a **Neon Postgres** database through Vercel Marketplace/Storage or neon.com. Add its connection string as `DATABASE_URL` in the Vercel project’s Environment Variables. The app creates its `records` table automatically. Use a separate database/branch for development and preview deployments.

## 4. Add environment variables

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Your Neon Postgres connection string |
| `CRON_SECRET` | A random secret of at least 16 characters |
| `RESEND_API_KEY` | A sending API key from your Resend account |
| `EMAIL_FROM` | `JobScout <jobs@your-verified-domain.com>`; use a sender verified in Resend |

Add production values to the **Production** environment. Redeploy after changing them. Do not paste API keys into the app, a GitHub file, or chat. Resend’s testing sender may be restricted to your account email; use a verified domain for normal delivery.

The app opens without a username or password. Anyone with its URL can view and change its shared preferences, recipient email and saved jobs. The background cron endpoint still requires `CRON_SECRET`; this is a server setting, not a login.

If updating an earlier version, replace `proxy.ts` and `lib/server.ts` with the files in this ZIP, commit, and redeploy. You may remove the unused `APP_PASSWORD` variable from Vercel.

## 5. Deploy and enable emails

1. Deploy, then open the Vercel production URL — no sign-in is required.
2. Set your job titles, location, salary and date filters. Select **Apply preferences**.
3. In **Daily digest**, enter your recipient email and save.
4. Select **Preview next digest**, then **Send now** to test delivery with real matches. No email is sent when there are no new matches.
5. Enable the daily digest and save again.
6. In Vercel’s Cron Jobs settings, verify `/api/cron` is registered. Check the first execution and your inbox.

The included cron runs daily at **16:00 UTC**: 9 a.m. Vancouver in summer, 8 a.m. in winter. On Vercel Hobby, invocation can occur later in the scheduled hour. Change the expression in `vercel.json` and redeploy to change the schedule. This is a fixed UTC schedule, so it does not adjust automatically for daylight saving time. Cron runs only on production deployments.

Vercel sends `CRON_SECRET` in the Authorization header. Unauthenticated requests to `/api/cron` are rejected. Previously emailed jobs are excluded. A persisted email snapshot and provider idempotency key protect same-day retries. A crashed send can be retried after a ten-minute lease expires. If a scheduled run fails, inspect the Vercel/Resend logs and retry from **Send now**; do not assume the platform automatically retries it.

## Notes

- GitHub stores the source; Vercel hosts the app. Neon stores preferences and jobs. Resend sends email. Each service can have its own limits or charges.
- Existing preferences and jobs from the earlier private ChatGPT Site are not copied into this new database.
- Remotive’s free feed is delayed by 24 hours. Arbeitnow is Europe-focused. This is not a complete search of LinkedIn or Indeed.
- Unclear salaries follow the “Include undisclosed or unclear pay” option. No currency conversion or inferred work eligibility is performed.
- Listing data is cached for six hours. Refresh does not bypass the cache.

## Run locally

Use Node 24 and pnpm. Run `pnpm install`, copy `.env.example` to `.env.local`, add development secrets, then run `pnpm dev`. Use a development Neon database. Run `pnpm test`, `pnpm typecheck` and `pnpm build` before deployment.

## Official references

- Vercel Git import: https://vercel.com/docs/deployments/git
- Cron setup: https://vercel.com/docs/cron-jobs/quickstart
- Cron limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Cron authentication: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Neon: https://neon.com/docs/serverless/serverless-driver
- Resend: https://resend.com/docs/api-reference/emails/send-email
