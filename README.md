# Appointly
The Smart Appointment Management Platform is a web-based application designed to centralize and simplify appointment scheduling across multiple domains and services.

## Environment setup

This repository has two separate apps:

- `client/` is a Next.js app.
- `server/` is a NestJS API.

Each app runs in its own Node.js process, so each app needs its own `.env` file.

### `client/.env`

- `AUTH_SECRET`
  Needed by NextAuth to sign and verify login sessions. It is read in [client/src/proxy.js](/Users/mac/Desktop/folders/projects/Appointly/client/src/proxy.js#L13) and by the auth setup in [client/lib/auth.js](/Users/mac/Desktop/folders/projects/Appointly/client/lib/auth.js).
- `AUTH_GOOGLE_ID`
  Needed for the Google sign-in provider configured in [client/lib/auth.js](/Users/mac/Desktop/folders/projects/Appointly/client/lib/auth.js#L70).
- `AUTH_GOOGLE_SECRET`
  Needed with `AUTH_GOOGLE_ID` for Google OAuth in [client/lib/auth.js](/Users/mac/Desktop/folders/projects/Appointly/client/lib/auth.js#L71).
- `DATABASE_URL`
  Needed because the Next.js app talks directly to PostgreSQL for auth and internal routes, not only through the Nest API. It is used in [client/lib/db.js](/Users/mac/Desktop/folders/projects/Appointly/client/lib/db.js).
- `NEXT_PUBLIC_API_URL`
  Needed because browser-side code calls the Nest API directly with Axios. It is used in [client/lib/axios.js](/Users/mac/Desktop/folders/projects/Appointly/client/lib/axios.js).

### `server/.env`

- `PORT`
  Needed so Nest knows which port to listen on. It is used in [server/src/main.ts](/Users/mac/Desktop/folders/projects/Appointly/server/src/main.ts#L15).
- `FRONT_END_URL`
  Needed for CORS so the API accepts requests from the Next.js app. It is used in [server/src/main.ts](/Users/mac/Desktop/folders/projects/Appointly/server/src/main.ts#L10).
- `DATABASE_URL`
  Needed because the Nest API also connects directly to PostgreSQL through Drizzle. It is used in [server/src/db/db.ts](/Users/mac/Desktop/folders/projects/Appointly/server/src/db/db.ts#L8) and [server/drizzle.config.ts](/Users/mac/Desktop/folders/projects/Appointly/server/drizzle.config.ts#L8).

### Why `DATABASE_URL` exists in both apps

Both apps open their own database connection:

- The Next.js app uses PostgreSQL for NextAuth, registration, and password-reset logic.
- The Nest app uses PostgreSQL for categories and services APIs.

That is why `client/.env` and `server/.env` both need `DATABASE_URL`.
