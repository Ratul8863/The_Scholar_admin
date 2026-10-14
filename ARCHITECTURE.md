# Scholar architecture

Scholar is one Next.js App Router application. Server Components read data. Server Actions mutate it. Route handlers exist for Auth.js and CSV export. There is no separate API server.

```text
src/app            routes, layouts, route handlers
src/components     shell, tables, forms, filters, badges
src/features       domain-specific client forms
src/models         Mongoose models and indexes
src/server/auth    Auth.js credentials, current user, permission asserts
src/server/domain  pure rules (deadlines, completeness, duplicates, workflow)
src/server/services  queries and mutations
src/server/actions mutations.ts server actions
src/server/permissions  permission catalog and default roles
```

Business rules live in `src/server/domain` and `src/server/services`. Pages assemble data and render it.

## Modules

| Module | Routes |
| --- | --- |
| Sign in | `/login` |
| Invitation | `/invite/[token]` |
| Dashboard | `/dashboard` |
| Scholarships | `/scholarships`, `/scholarships/new`, `/scholarships/[id]` |
| Universities | `/universities`, `/universities/new`, `/universities/countries/[countryId]`, `/universities/[id]`, `/universities/[id]/programs/new`, `/universities/programs/[programId]` |
| Professors | `/professors`, `/professors/table`, `/professors/countries/[countryId]`, `/professors/countries/[countryId]/new`, `/professors/universities/[id]`, `/professors/universities/[id]/departments/new`, `/professors/departments/[id]`, `/professors/departments/[id]/new`, `/professors/records/[id]` |
| Co-curricular | `/opportunities`, `/opportunities/[type]`, `/opportunities/[type]/new`, `/opportunities/view/[id]` |
| Emergency | `/emergency`, `/emergency/new`, `/emergency/[id]` |
| Content | `/content`, `/content/new`, `/content/[id]` |
| Deadlines | `/deadlines` |
| Verification | `/verification`, `/verification/[entityType]/[entityId]` |
| Daily work | `/daily-work` |
| Team | `/team` |
| Activity | `/activity` |
| Settings | `/settings` |
| Import | `/imports` |
| Export | `GET /api/exports/[entity]` |
| Auth.js | `/api/auth/[...nextauth]` |

`type` for opportunities is `leadership`, `fellowship`, or `internship`. Those three, plus Emergency Upload, are the only primary co-curricular sections.

## Database

MongoDB is the only system of record. Mongoose models enforce document shape. Dashboard, content queues, and deadline windows use targeted queries and projections rather than loading full collections into the browser.

Mutable research documents carry `createdAt`, `updatedAt`, `version`, `archivedAt`, and `archivedBy`. Activity logs are append-only.

Main collections: `users`, `roles`, `invitations`, `rateLimits`, `countries`, `degreeLevels`, `fundingTypes`, `fieldsOfStudy`, `researchAreas`, `documentTypes`, `statusConfigurations`, `systemSettings`, `scholarships`, `universities`, `universityPrograms`, `programIntakes`, `universityRankings`, `professorResearchUniversities`, `professorDepartments`, `professors`, `professorPublications`, `opportunities`, `emergencyUpdates`, `contents`, `deadlines`, `sources`, `assignments`, `notes`, `verificationTemplates`, `verificationRuns`, `customFieldDefinitions`, `savedViews`, `notifications`, `dailyWorkEntries`, `activityLogs`, `importJobs`.

Indexes follow the filters the product actually runs: country plus status, normalized name, email, opening and closing dates, `entityType` + `entityId`, content status plus updated time, and activity actor/entity/time. They are declared next to the models.

`MONGO_TRANSACTIONS=true` wraps invitation acceptance and similar multi-document writes in a MongoDB transaction. On a standalone server the same writes run in order without a transaction.

## Authentication

There is no public signup. `npm run seed` creates the first admin from environment variables. Admins invite teammates. The invitation token is random, stored as a SHA-256 hash, expires in seven days, and can be used once. Revoked invitations stay revoked.

The user sets a password of at least 12 characters containing a letter and a number. Passwords are hashed with bcrypt. Auth.js uses the Credentials provider and a JWT session in an HTTP-only cookie. Auth.js does not offer database sessions for that provider, so every protected layout reloads the user from MongoDB and rejects a disabled account or a stale `sessionVersion`. Logout clears the session. Login attempts are rate-limited in MongoDB.

`src/proxy.ts` redirects anonymous requests to `/login` before they reach the app shell. `/login`, `/invite`, and `/api/auth` stay public.

## Authorization

Features call `assertPermission` / `hasPermission` with keys such as `scholarship.update` and `content.publish`. They do not branch on `role === "Admin"`.

Default roles are Admin, Researcher, Verifier, Content Manager, Editor, Designer, and Viewer. Each role is a named set of permission keys. Admins can edit those sets in Settings. Changes are written to the activity log. Hiding a navigation item is not the security boundary. Server actions check the permission again.

## Professor universities and main universities

Main research is `countries` → `universities` → `universityPrograms` → `programIntakes`, with rankings and deadlines attached to those records.

Professor research is `countries` → `professorResearchUniversities` → `professorDepartments` → `professors`. Creating a professor-research university does not insert or update a main university, even when the names match. Countries are shared reference data. The two university collections are not.

## Deadlines

Deadlines live in one collection with `entityType`, `entityId`, optional sub-entity, deadline type, opening date, closing date, timezone, source URL, and verification status. Content planned dates are included when a content record has them. The content module does not keep a second copy of scholarship or opportunity dates.

State is computed when the page is rendered:

- no usable dates → unknown
- closing date in the past → closed
- closing date within `deadlineWarningDays` (default 14, configurable) → closing soon
- otherwise a future opening or closing date → upcoming

Days remaining and days until opening are computed in the stored timezone, or UTC when no timezone was provided. Missing dates are not guessed. Users cannot type a days-remaining value.

The deadlines screen buckets the next 5, 7, 30, and 60 days, past/closed, and opening soon. Each row links to the source record.

## Verification

Verification is a checklist, not a boolean. Templates define items per entity type. A run stores each item as checked, not checked, needs correction, or not applicable. Progress, missing required items, and correction counts are calculated from those states. History is the verification run plus the activity log. Verifier assignment uses the shared assignment collection.

## Custom fields

`customFieldDefinitions` holds the schema: entity type, key, label, type, required, options, order, and active flag. Values are stored on the entity document under `customFields`, not in a separate value row per field. Saves validate values against the active definitions. Creating or changing a definition writes an audit event.

Supported types include text, long text, number, currency, percentage, date, datetime, checkbox, single select, multi select, URL, email, rating, user, and status.

## Audit

`writeAudit` is the only writer of `activityLogs`. Entries store actor, action, entity type, entity id, old/new field changes, metadata, and timestamp. Normal product flows do not update or delete those rows. Tracked actions include create, edit, assign, verify, correction, publish, unpublish, import, archive, restore, and role or custom-field changes.

## Content workflow

A content record stores a title, type, status, country, assignee roles, dates, public URL, notes, and a reference (`relatedEntityType`, `relatedEntityId`). It does not embed the scholarship, university, or opportunity document.

Statuses:

`idea` → `researching` → `draft` → `ready_for_design` → `designing` → `ready_for_review` → `correction_required` → `ready_to_publish` → `published`, plus `archived` and `unpublished`.

Reaching ready to publish does not publish. Publishing is an explicit transition that requires `content.publish`. Each transition is validated and audited.

The content workspace is one query-built page, in this order: emergency updates, upcoming deadlines, applications opening soon, newly updated research, ready to publish, published content, and productivity counts.

## Search, filters, and imports

List pages search on the server and keep `q`, page, sort, and filters in the URL. Results are paginated. The professor grid adds column visibility, column resize, row selection, a sticky first column, and inline edit of the professional email.

Imports accept CSV (including Excel-style CSV) and JSON. The pipeline parses, validates, previews duplicates, and then creates or skips. A row that matches an existing record is skipped unless the operator confirms create-anyway. Non-empty verified fields are not replaced by an import. The result counts created, skipped, duplicate, invalid, and failed rows. Import files are limited to 5 MB. CSV export is permission-checked and capped at 100,000 rows as an infrastructure bound, not a product limit on how many records can be stored.

Duplicate detection normalizes case, whitespace, punctuation, and URLs, then scores domain-specific signals (name, provider or organization, country, official URL, email, department). Country alone is not enough to call a duplicate.

## What is intentionally not in this version

- A public scholarship website. Published content keeps a `publicUrl` so a later site can read approved records without internal notes, assignments, verification notes, or the activity log.
- Google Calendar sync. Deadline documents already store timezone and source URL.
- TanStack Virtual. Pages render one server-side page of rows, so virtualization does not change correctness.
- Fabricated sample scholarships, rankings, tuition, or professor emails. The seed is configuration only.
