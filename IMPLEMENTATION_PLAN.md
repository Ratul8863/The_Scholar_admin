# Scholar — Implementation Plan

Source of truth: `SCHOLAR — A-TO-Z MASTER BUILD PROMPT - Google Docs.pdf`, with the technology stack overridden by the production build instruction (Next.js, MongoDB, Auth.js). The PDF’s Supabase/PostgreSQL/RLS requirements are reinterpreted as equivalent server-side authorization, not omitted.

Repository audit (Phase 0): the workspace contained only the PDF. There was no existing framework, schema, auth, or UI to preserve. The application is created from scratch.

## 1. Requirement inventory

### Product

Internal research operating system for scholarships, universities, programs, intakes, rankings, an independent professor-research hierarchy, leadership, fellowships, internships, emergency/recent news, content production, deadlines, verification, assignments, daily work, activity history, configurable reference data, and custom fields.

### Authentication and team

- Invitation-only. No public registration. No shared password.
- Admin invites by email. Expiring one-time token. User sets credentials. Account becomes active.
- Logout, session expiry, disabled users blocked, revoked invitations unusable.
- Passwords hashed. Invitation tokens stored as hashes. HTTP-only cookies. CSRF-safe Auth.js/Next.js flows.
- Email behind a provider interface (console in development, Resend when configured).
- Roles are labels. Authorization is permission keys enforced on the server. UI hiding is additional, not sufficient.
- Team: members, roles, active state, responsibilities, assignments, workload, invitation state. No auth secrets shown.
- Role/permission changes are audited.

### Shared platform behavior

- One application shell, navigation, type, spacing, tables, filters, forms, dialogs, drawers, badges, pagination, breadcrumbs, empty/loading/error states.
- Server-side search, URL query state, multi-filter, removable chips, saved views.
- Central sources, assignments, deadlines, notes, custom fields, notifications, audit.
- Completeness and verification progress are calculated.
- Duplicate detection before create/import. Never silently overwrite verified data.
- Archive/soft-delete by default. Optimistic concurrency via `version`.
- In-app notifications with an email-capable architecture.
- CSV export of filtered and selected rows, permission-checked, streamed/batched.
- Import: upload/paste, parse, map, validate, preview, duplicates, confirm, batch save, row errors, idempotent-safe skips.
- No artificial record caps. No fabricated research facts. Unknown stays unknown.
- Responsive from 320px upward. Horizontal scroll only inside tables.
- WCAG-oriented semantics, keyboard access, focus, labels, contrast, non-color status, reduced motion.

### Domain modules

| Module | Requirement |
| --- | --- |
| Dashboard | Live counts, deadline buckets, content workflow summary, recent activity, workload. No fake metrics. |
| Countries | Shared reference data. Add, edit, activate, reorder. Used by every module without merging their hierarchies. |
| Scholarships | Identity, provider, country, degree, funding (many types + detail fields), eligibility, documents, application, separate research status, publication status, derived deadline state, assignments, verification, URLs, sources, notes, custom fields, structured detail sections. |
| Universities | Country → University → Program → Intake. Type, application status, acceptance rate, description, tuition, fees, eligibility, Bangladesh eligibility, scholarship availability, requirements, rankings with sources, deadlines, notes, custom fields. Rankings never invented. Link to scholarships without copying them. |
| Professors | Independent Country → Professor Research University → Department → Professor. Not a foreign key to main universities. Airtable-like table: search, sort, filter, pagination, selection, column visibility, resize, freeze, bulk actions, safe inline edit, import/export. Publications, profile links, lab, ORCID, Scholar. |
| Co-curricular | Exactly four sections: Leadership, Fellowship, Internship, Emergency Upload / Recent News. Shared opportunity model for the first three with type-specific fields. |
| Emergency | Title, type, country, related scholarship/university/opportunity, source, body, upload date, urgency (Normal/High/Emergency), assignee, verifier, verification status, content status, notes. Visually distinct. |
| Content | Single aggregated workspace in priority order: emergency, upcoming deadlines, opening soon, new information, ready to publish, published, productivity. Workflow does not auto-publish. Content stores references, not copied source records. |
| Deadlines | Central typed records. Buckets: 5/7/30/60 days, past, opening soon. Links back to source. Timezone stored when provided. Days remaining calculated. Calendar integration deferred (no Google OAuth). |
| Verification | Cross-domain queue. Templates. Item states: checked, not checked, needs correction, not applicable. Progress, missing required items, history, source links, verifier assignment. |
| Daily work | Notes, completed entries, linked entities, user, date, optional duration, category, weekly and monthly summaries. Operational tracking, not surveillance. |
| Activity | Append-only. Old/new values. Normal users cannot edit it. |
| Settings | Countries, degree levels, funding types, research areas, opportunity types, statuses, roles, permissions, verification templates, publication requirements, deadline thresholds, custom fields, system configuration. |
| Custom fields | Definitions centralized. Values stored on `customFields` of the entity (not a relational EAV table). Validated against definitions. Structural changes audited. |
| Notes | Categories: general, internal, research, important, additional. Authorship preserved. |
| Public compatibility | Published content can later feed a public site. Internal notes, assignments, verification, activity, and unpublished workflow are never shaped as public payloads. Public site is not built. |

### Acceptance flows to support

Admin invite → activation → sign-in → protected app. Scholarship create/assign/verify/deadline/content/publish. University → program → intake → ranking. Professor country → research university → department → professor. Opportunity verification. Emergency appears in Content. Content workflow with explicit publish. Daily work weekly/monthly. Unauthorized user blocked.

## 2. Architecture decisions

1. **One Next.js App Router application.** Route Handlers for auth, exports, and imports. Server Actions for mutations. Server Components for initial reads.
2. **MongoDB is the only system of record.** Mongoose enforces document shape. Aggregations are used for dashboard, content queues, and deadline buckets.
3. **Auth.js credentials + JWT in HTTP-only cookies.** Auth.js does not support database sessions for the Credentials provider. Users, invitations, and a `sessionVersion` live in MongoDB. Every protected layout reloads the user and rejects disabled accounts or stale session versions. This is the production-compatible equivalent of the PDF’s Supabase session requirement.
4. **Permissions, not role equality checks.** `authorize(user, permission)` is the only gate. Default roles ship with permission sets and remain editable by admins.
5. **Professor research universities are a separate collection** (`professorResearchUniversities`). Creating one never writes to `universities`.
6. **Deadlines, sources, assignments, notes, and notifications are shared collections** with `entityType` + `entityId`. Content reads them by query.
7. **Custom values live on the parent document** under `customFields` to match MongoDB query patterns. Definitions live in `customFieldDefinitions`.
8. **Deadline state and days remaining are pure functions** of dates, timezone, and the configured closing-soon threshold. They are not stored as user input.
9. **Completeness is the share of configured required core fields that are filled.** Optional and custom fields do not reduce the score. Verification progress is separate.
10. **Imports never replace a non-empty verified field.** Conflicts are skipped and reported. Duplicate acknowledgement is explicit.
11. **First administrator** is created only by `npm run seed` using server-side environment variables. The login screen has no signup.
12. **Reference taxonomies** (degree levels, funding types, statuses, verification templates, deadline threshold) are seeded as editable configuration. No scholarships, universities, professors, rankings, tuition, or other research facts are seeded.
13. **TanStack Virtual is not installed.** Server-side pagination keeps rendered rows small, so virtualization would not change correctness. TanStack Table is used for data grids.
14. **Rate limiting** for login and invitation acceptance is stored in MongoDB so it works across instances.
15. **Transactions** are used for invitation acceptance (create user + consume invitation) and for publish flows that update content plus audit. Standalone MongoDB without a replica set falls back to ordered writes with audit; Atlas replica sets use transactions when `MONGO_TRANSACTIONS=true`.

## 3. Module inventory

| Area | Location |
| --- | --- |
| Routes | `src/app/(auth)`, `src/app/(app)`, `src/app/api` |
| UI primitives | `src/components/ui` |
| Shell | `src/components/layout` |
| Shared interface | `src/components/tables`, `forms`, `filters`, `feedback`, `domain` |
| Feature UI/actions | `src/features/*` |
| Persistence | `src/models`, `src/server/db`, `src/server/repositories` |
| Business rules | `src/server/services`, `src/server/domain` |
| Auth and RBAC | `src/server/auth`, `src/server/permissions` |
| Validation | `src/schemas` |
| Pure logic tests | `src/server/domain/*.test.ts` |

## 4. Collections and major indexes

Timestamps (`createdAt`, `updatedAt`) are on mutable collections. Activity logs are append-only. Archived records use `archivedAt` and `archivedBy`.

| Collection | Purpose | Indexes |
| --- | --- | --- |
| users | Accounts | unique email; roleId + active |
| roles | Named permission sets | unique key |
| invitations | One-time invites | tokenHash; email + status; expiresAt |
| rateLimits | Auth throttling | unique key |
| countries | Shared countries | unique code; active + displayOrder |
| degreeLevels, fundingTypes, fieldsOfStudy, researchAreas | Taxonomy | unique key |
| statusConfigurations | Named status sets | entityScope + key |
| scholarships | Scholarship research | countryId + researchStatus; publicationStatus; normalizedName; openingDate; closingDate; archivedAt; text-capable name/provider |
| universities | Main universities | countryId + archivedAt; normalizedName; website |
| universityPrograms | Programs | universityId + archivedAt; name |
| programIntakes | Intakes | programId; openingDate; closingDate |
| universityRankings | Rankings | universityId + year |
| scholarshipUniversityLinks | Applicable scholarships | universityId; scholarshipId |
| professorResearchUniversities | Professor hierarchy only | countryId + archivedAt; normalizedName |
| professorDepartments | Departments | professorUniversityId |
| professors | People | professorUniversityId + departmentId; normalizedName; email; archivedAt |
| professorPublications | Publications | professorId |
| opportunities | Leadership, fellowship, internship | type + countryId + archivedAt; closingDate; openingDate |
| emergencyUpdates | Urgent information | urgency + createdAt; countryId; verificationStatus |
| contents | Content workflow | contentStatus + updatedAt; relatedEntityType + relatedEntityId; countryId |
| deadlines | Central dates | entityType + entityId; closingDate; openingDate |
| sources | Official sources | entityType + entityId |
| assignments | Work assignment | entityType + entityId; userId + status |
| notes | Authored notes | entityType + entityId + createdAt |
| verificationTemplates | Checklist definitions | entityType + active |
| verificationRuns | Checklist results | entityType + entityId + updatedAt |
| customFieldDefinitions | Column definitions | entityType + fieldKey unique; entityType + active |
| savedViews | Filters/columns | ownerId + entityType |
| notifications | In-app notices | userId + readAt + createdAt |
| dailyWorkEntries | Daily work | userId + workDate |
| activityLogs | Audit | entityType + entityId + createdAt; actorUserId + createdAt |
| importJobs | Import progress | createdBy + createdAt |
| systemSettings | Singleton configuration | key unique |

`version` on user-edited research documents supports optimistic concurrency.

## 5. Permission model

Default roles: Admin, Researcher, Verifier, Content Manager, Editor, Designer, Viewer.

Permissions (assignable, not hard-coded as role checks in features):

`scholarship.read|create|update|verify|publish`, `university.read|create|update|verify`, `professor.read|create|update|verify`, `opportunity.read|create|update|verify`, `emergency.read|create|update|verify`, `content.read|create|update|assign|design|review|publish`, `deadline.read|update`, `verification.read|update`, `team.manage`, `settings.manage`, `custom_fields.manage`, `activity.read`, `import.run`, `export.run`, `daily_work.manage`, `record.archive`, `record.delete`.

Admin receives every permission. Other roles receive the subset that matches their job. Admins may edit role permission sets in Settings. Server actions call `requirePermission`.

## 6. Route map

| Path | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/invite/[token]` | Accept invitation and set password |
| `/dashboard` | Operational home |
| `/scholarships`, `/scholarships/new`, `/scholarships/[id]` | Scholarship research |
| `/universities`, `/universities/countries/[countryId]`, `/universities/[id]`, `/universities/programs/[programId]` | Main university hierarchy |
| `/professors`, `/professors/countries/[countryId]`, `/professors/universities/[id]`, `/professors/departments/[id]`, `/professors/records/[id]`, `/professors/table` | Professor research |
| `/opportunities`, `/opportunities/[type]`, `/opportunities/view/[id]` | Leadership, fellowship, internship |
| `/emergency`, `/emergency/[id]` | Emergency upload |
| `/content`, `/content/[id]` | Content workspace and records |
| `/deadlines` | Deadline intelligence |
| `/verification`, `/verification/[entityType]/[entityId]` | Verification center |
| `/daily-work` | Daily notes and productivity |
| `/team` | Members and invitations |
| `/activity` | Audit trail |
| `/settings` and nested settings pages | Configuration |
| `/imports` | Import pipeline |
| `/api/auth/[...nextauth]` | Auth.js |
| `/api/exports/[entity]` | CSV export |

## 7. Content workflow

`idea → researching → draft → ready_for_design → designing → ready_for_review → correction_required → ready_to_publish → published`, plus `archived` and `unpublished`.

`ready_to_publish` does not publish. `content.publish` is required for `published`. Transitions are validated. Each transition writes an activity event and, where relevant, a notification.

## 8. Deadline and completeness rules

- Missing dates stay unknown. They are not inferred.
- Closing date before now → Closed.
- Closing date within `deadlineWarningDays` (settings, default 14) → Closing Soon.
- Otherwise, if a closing or opening date exists in the future → Upcoming.
- Days remaining and days until opening are computed in the record timezone when present, otherwise UTC.
- Completeness = filled required fields / required fields. Verification checklist completion is shown separately.

## 9. Duplicate signals

Normalization: case, whitespace, punctuation, trailing slashes, and URL host/path. Matching is scored, not exact-only.

- Scholarship: name, provider, country, official URL.
- University and professor-research university: name, country, website.
- Professor: name, professor-research university, department, email, official profile.
- Opportunity: name, organization, country, official URL.

UI actions: view existing, compare, keep existing, create anyway, cancel. Merge (admin) fills only empty fields on the surviving record and archives the other. Verified non-empty values are kept.

## 10. Implementation phases

0. Discovery and this plan.
1. Foundation: Next.js, TypeScript strict, Tailwind tokens, env validation, Mongo connection, Auth.js, permissions, shell.
2. Shared domain services and reference data.
3. Dashboard from live queries.
4. Scholarships.
5. Main universities, programs, intakes, rankings.
6. Professor research hierarchy and table.
7. Co-curricular and emergency.
8. Content workspace and workflow.
9. Deadlines.
10. Verification.
11. Daily work.
12. Team, activity, settings.
13. Saved views, import/export, custom fields, duplicates, bulk actions.
14. Indexes, security headers, responsive layout, accessibility.
15. Unit tests and Playwright coverage of the critical paths. Seed + memory or Atlas MongoDB for execution.

## 11. Testing plan

Unit tests (Vitest), no database required:

- permission evaluation
- deadline state and day counts
- completeness
- duplicate normalization and scoring
- custom-field validation
- content workflow transitions
- invitation token hash/expiry rules
- verification progress

Playwright:

- unauthenticated access to `/dashboard` redirects to login
- invitation page rejects a bad token
- login form is present and has no registration link

Full invite → publish journeys require a MongoDB URI. `npm run seed` plus `npm run test:e2e` is the documented path. Unit tests cover the business rules those journeys depend on even when Atlas is not configured in this environment.

## 12. Unresolved assumptions

- Credentials (email + password) are the authentication method. The PDF’s “verifies through email” is implemented as invitation-email proof plus password setup, not a magic link on every login. Magic links can be added behind the same user record later.
- Emergency updates are their own collection because their fields (urgency, related records, free-text information) differ from leadership/fellowship/internship. The four sections remain the only primary co-curricular categories.
- Countries are shared. Professor navigation filters countries that already have professor-research universities and still lets an admin attach any country. A country is not copied into a second country table.
- Google Calendar is an explicit non-goal for this version. Deadline documents keep timezone, source URL, and stable ids so a later sync can be added.
- `MONGO_TRANSACTIONS` defaults off so a standalone local MongoDB works. Enable it on Atlas.
- Column freeze is the first data column in the professor grid (CSS sticky), not an arbitrary Excel freeze-pane engine.
- Inline edit is limited to short professor fields (designation, email, research areas). Complex records use forms.
- Merge is safe-fill plus archive, not a destructive field-by-field overwrite.
- The first admin cannot be created from the UI. That avoids turning bootstrap into public registration.
