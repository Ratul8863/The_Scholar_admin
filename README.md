# Scholar

Scholar is an internal research operating system for scholarship, university, professor, and content operations. It is a private Next.js application backed by MongoDB. There is no public registration and no public research site.

## Requirements

- Node.js 20 or newer (developed on Node 24)
- MongoDB Atlas, or a local MongoDB reachable from this machine
- An invitation from an administrator, or the seeded first admin account

## Setup

```bash
npm install
copy .env.example .env.local
```

Edit `.env.local`. `MONGODB_URI` and `AUTH_SECRET` are required. `AUTH_SECRET` must be at least 16 characters. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Never commit `.env.local`. Never prefix these values with `NEXT_PUBLIC_`.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Server only. |
| `MONGODB_DB` | Database name. Defaults to `scholar`. |
| `AUTH_SECRET` | Auth.js session signing secret. |
| `AUTH_URL` | Public origin used by Auth.js, for example `http://localhost:3000`. |
| `APP_URL` | Origin used in invitation links. |
| `RESEND_API_KEY` | Optional. When set with `EMAIL_FROM`, invitations are sent through Resend. |
| `EMAIL_FROM` | From address for transactional email. |
| `EMAIL_NOTIFICATIONS` | `true` to also email in-app notification events. |
| `SEED_ADMIN_EMAIL` | First administrator email. Used only by `npm run seed`. |
| `SEED_ADMIN_NAME` | First administrator display name. |
| `SEED_ADMIN_PASSWORD` | First administrator password. At least 12 characters, with a letter and a number. |
| `MONGO_TRANSACTIONS` | Set `true` on Atlas replica sets. Leave `false` for standalone MongoDB. |

Without Resend, invitation links are written to the server log by the console email provider.

## MongoDB

1. Create a database user and connection string in MongoDB Atlas, or run MongoDB locally.
2. Put the connection string in `MONGODB_URI`.
3. Run the seed. It creates default roles, degree levels, funding types, document types, status labels, verification templates, system settings, and the first admin if that email does not already exist. It does not insert scholarships, universities, rankings, professors, or any other research facts.

```bash
npm run seed
```

Indexes are declared on the Mongoose models and are created when the application connects (`autoIndex` in development and production startup connections).

## Development

```bash
npm run dev
```

Open `http://localhost:3000`. Unauthenticated visitors are sent to `/login`.

## Production build

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

The app is designed to run on Vercel or any Node host that can reach MongoDB. Domain logic does not call Vercel-specific APIs. Set the same environment variables in the host. Enable `MONGO_TRANSACTIONS=true` when the cluster is a replica set.

## Testing

```bash
npm test
```

Vitest covers permission checks, deadline calculation, completeness, duplicate normalization, custom-field validation, content workflow transitions, invitation token rules, and verification progress. These tests do not need a database.

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright covers the sign-in redirect, the absence of a registration control, and rejection of an invalid invitation. The suite starts the app on port 3100 so it does not attach to another process already using port 3000. Journeys that create scholarships or publish content need a running MongoDB and a seeded admin.

## Architecture

See `ARCHITECTURE.md` for modules, collections, authorization, deadlines, the professor/university split, verification, custom fields, audit, content workflow, search, and imports. `IMPLEMENTATION_PLAN.md` is the requirement inventory and the decisions taken where the source PDF was ambiguous.
