"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { ScholarLogo } from "@/components/brand/scholar-logo";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; permission?: string };

const items: { label: string; entries: Item[] }[] = [
  { label: "", entries: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Research",
    entries: [
      { href: "/scholarships", label: "Scholarships", icon: GraduationCap, permission: "scholarship.read" },
      { href: "/universities", label: "Universities", icon: Building2, permission: "university.read" },
      { href: "/professors", label: "Professors", icon: BookOpen, permission: "professor.read" },
      { href: "/opportunities", label: "Co-Curricular", icon: Shield, permission: "opportunity.read" },
    ],
  },
  {
    label: "Operations",
    entries: [
      { href: "/content", label: "Content", icon: NotebookPen, permission: "content.read" },
      { href: "/deadlines", label: "Deadlines", icon: CalendarClock, permission: "deadline.read" },
      { href: "/verification", label: "Verification", icon: BadgeCheck, permission: "verification.read" },
      { href: "/daily-work", label: "Daily Work", icon: NotebookPen, permission: "daily_work.manage" },
    ],
  },
  {
    label: "Organization",
    entries: [
      { href: "/team", label: "Team", icon: Users, permission: "team.manage" },
      { href: "/activity", label: "Activity Log", icon: Activity, permission: "activity.read" },
    ],
  },
  {
    label: "Administration",
    entries: [
      { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
      { href: "/imports", label: "Import", icon: Activity, permission: "import.run" },
    ],
  },
];

function OrgMenu({
  user,
  logoutAction,
}: {
  user: { name: string; roleName: string };
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!slot.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="org-slot" ref={slot}>
      <button type="button" className="org-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <span className="min-w-0 flex-1 truncate">{user.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      </button>
      {open ? (
        <div className="org-menu" role="menu">
          <p className="type-16 truncate">{user.name}</p>
          <p className="type-14 mb-3 truncate">{user.roleName}</p>
          <form action={logoutAction}>
            <button type="submit" className="open-pill w-full" role="menuitem">Log out</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({
  user,
  logoutAction,
  children,
}: {
  user: { name: string; roleName: string; permissions: string[] };
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visible = items
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => !entry.permission || user.permissions.includes(entry.permission)),
    }))
    .filter((group) => group.entries.length);
  const flat = visible.flatMap((group) => group.entries);

  function current(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  return (
    <div className="app-frame">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <aside className="shell-aside">
        <div className="rail-col">
          <Link href="/dashboard" className="rail-brand" aria-label="The Scholar">
            <ScholarLogo variant="lockup" alt="" />
          </Link>
          <OrgMenu user={user} logoutAction={logoutAction} />
          <nav aria-label="Primary">
            {visible.map((group) => (
              <div key={group.label || "home"} className="mb-4">
                {group.label ? <p className="type-14 mb-1 px-3">{group.label}</p> : null}
                <ul className="grid gap-1">
                  {group.entries.map((entry) => {
                    const Icon = entry.icon;
                    const active = current(entry.href);
                    return (
                      <li key={entry.href}>
                        <Link href={entry.href} className="nav-pill w-full justify-start" aria-current={active ? "page" : undefined} title={entry.label}>
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-start">{entry.label}</span>
                          <ChevronRight className="nav-arrow h-4 w-4 shrink-0" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="shell-main">
        <div className="shell-top">
          <OrgMenu user={user} logoutAction={logoutAction} />
        </div>
        <main id="main">{children}</main>
        <nav className="bottombar" aria-label="Primary">
          {flat.map((entry) => {
            const Icon = entry.icon;
            const active = current(entry.href);
            return (
              <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} title={entry.label}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="bottom-label">{entry.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
