# SakhiSetu

SakhiSetu is a multilingual shop ledger, inventory, customer credit, and business-insights application. The repository now includes a Fastify/PostgreSQL backend foundation and an IndexedDB-backed frontend; provider credentials and production infrastructure are configured outside the source tree.

## Local development with Neon

You do not need to install PostgreSQL or pgAdmin to run the app locally. Neon hosts the PostgreSQL server; pgAdmin is an optional database-management client.

1. Create a Neon project and database. In the Neon Console, open **SQL Editor** and run the contents of `db/migrations/001_initial_schema.sql` as the project owner.
2. Create a dedicated runtime database role. Do not use the migration/database-owner account for the API. Run the following in the Neon SQL Editor after applying the migration:

   ```sql
   CREATE ROLE sakhisetu_api LOGIN PASSWORD 'set-a-secret-outside-source-control' NOBYPASSRLS;
   GRANT USAGE ON SCHEMA public TO sakhisetu_api;
   GRANT SELECT, INSERT, UPDATE, DELETE ON
     shops, users, products, customers, shop_invites, transactions, audit_logs, payment_orders
     TO sakhisetu_api;
   GRANT EXECUTE ON FUNCTION app_current_shop_id() TO sakhisetu_api;
   GRANT EXECUTE ON FUNCTION auth_find_users(text) TO sakhisetu_api;
   GRANT EXECUTE ON FUNCTION auth_create_shop(text, text, text, text, text) TO sakhisetu_api;
   GRANT EXECUTE ON FUNCTION auth_accept_invite(text) TO sakhisetu_api;
   GRANT EXECUTE ON FUNCTION process_payment_link(text, bigint) TO sakhisetu_api;
   ```

   The API role must not own these tables and must not have `BYPASSRLS`. The authentication/payment functions are deliberately not executable by `PUBLIC`.
3. In Neon, open **Connect**, select the branch, database, and `sakhisetu_api` role, and copy the pooled connection string. Copy `.env.example` to `.env` and replace `DATABASE_URL` with that connection string. Keep its credentials private. Set a random `SESSION_SECRET` of at least 32 characters. Add provider credentials only to the server environment.
4. Install packages and run the frontend and API in separate terminals:

   ```bash
   npm install
   npm run dev
   npm run dev:api
   ```

   Vite proxies `/api` requests to the local Fastify server. `npm run build` checks both TypeScript projects and builds the PWA shell.
   The API container can be built with `docker build -f Dockerfile.api -t sakhisetu-api .`; inject its secrets through the container host, not the image.

Using Neon lets this local app use a cloud database, but does not publish the app to other devices. Remote users also need the frontend and API deployed; set `DATABASE_URL` in the API host's secret settings, never in frontend code.

## Architecture currently in the repository

- **Tenant database:** PostgreSQL tables are scoped by `shop_id`; row-level policies use a transaction-local shop context. The API derives that context from a signed, HTTP-only session cookie, never from a client-supplied shop identifier.
- **Atomic ledger writes:** `POST /api/transactions` uses a PostgreSQL transaction to insert the ledger/audit records, adjust inventory by a delta, and update customer balances. `clientTxnUuid` is unique per shop for idempotent retries. Amounts, cost basis, and GST are calculated or checked server-side.
- **Authentication and roles:** OTP verification uses Twilio Verify; sessions are short-lived JWT cookies. Quick-unlock PINs are bcrypt-hashed. Owners can invite staff/accountants; staff are limited to sales, and the passport export endpoint denies staff access.
- **Offline/PWA:** Business state and pending transactions use Dexie/IndexedDB. Pending transactions are retried when connectivity returns. A first-party service worker caches the app shell and does not cache API responses.
- **AI/payments/monitoring:** Gemini parsing is proxied through `/api/sakhi/parse`; Razorpay payment links are created server-side and a signed webhook updates payment verification. Frontend errors can be sent to Sentry when `VITE_SENTRY_DSN` is configured.

## Provider and production setup still required

This codebase is **not yet production-ready**. Before handling real financial records:

- Configure Twilio Verify, Gemini, Razorpay, and Sentry credentials in the hosting provider's secret manager; set Razorpay's webhook URL to `/api/payments/webhook/razorpay` and subscribe to `payment_link.paid`.
- Apply and test migrations using a non-owner API database role. Add automated integration tests for RLS isolation, OTP, idempotent retries, concurrent stock changes, and signed webhooks.
- Choose and configure Bhashini or Sarvam for regional speech input/output. Browser speech is still used as a fallback; server-side regional speech endpoints are not implemented.
- Configure WhatsApp Business templates and a scheduled due-date/reminder worker. Automated WhatsApp reminders are not implemented.
- Provision frontend/API hosting, TLS, managed PostgreSQL point-in-time recovery/backups, deployment secrets, server-side error monitoring, and an operational restore procedure.
- For multiple API instances, configure a shared rate-limit store; the current limiter is process-local.
- The offline queue currently covers transactions. Product/customer creation and profile edits require connectivity, and existing browser `localStorage` records are not automatically imported into a cloud shop.

Never put database credentials, OTP/payment tokens, or AI keys in Vite environment variables or browser code. Only `VITE_SENTRY_DSN` is intended for the frontend.
