<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Short operational requests are often written in Bangla; carry them out and answer in Bangla.
- Visual language is Academic Minimal: deep navy, academic blue, soft slate neutrals, and white surfaces. Do not copy Nawaar's sand palette, 35–40px radii, typography sizes, or class names.
- Use refined pill buttons, consistent custom form controls, and searchable comboboxes for large university, country, and professor lists.
- Apply a slight lift hover only to clickable cards (about 3px, ~180ms). Leave tables, static cards, and forms still. Avoid glassmorphism, heavy shadows, dark hover overlays, and opacity-only hovers.
- Keep one shared design system across every module. Preserve auth, permissions, MongoDB, search, filters, and CRUD when changing UI.

## Learned Workspace Facts

- Scholar is an internal research operating system. Functional requirements come from the SCHOLAR A-TO-Z master build PDF; that PDF's Supabase/PostgreSQL stack is overridden.
- Stack is Next.js App Router, React, TypeScript (strict), Tailwind, MongoDB Atlas with Mongoose, Auth.js/NextAuth, invitation-only onboarding (no public signup), Vitest, and Playwright. UI primitives are shadcn/Radix, Lucide, TanStack Table, React Hook Form, and Zod, wrapped in an original Scholar design system.
- Main universities (Country → University → Program → Intake) and professor-research universities (Country → Professor Research University → Department → Professor) are separate records and must not be merged or synced.
- Authorization is permission-based on both UI and server mutations. Default roles include Admin, Researcher, Verifier, Content Manager, Editor, Designer, and Viewer.
- The product lockup is "The Scholar". The collapsed sidebar shows only the book mark; the browser tab title is The Scholar.
- Production deploys go to the Vercel project `the-scholar` (https://the-scholar-lyart.vercel.app). The older Vercel project named `scholar` is a different app (`apps/web`, pnpm) and must not receive this codebase.
- Production data uses MongoDB Atlas. A localhost MongoDB URI is unreachable from Vercel.
