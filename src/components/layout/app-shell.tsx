"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
  Menu,
  NotebookPen,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { ScholarLogo } from "@/components/brand/scholar-logo";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; permission?: string };
type Group = { label: string; entries: Item[] };

const items: Group[] = [
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
  compact = false,
}: {
  user: { name: string; roleName: string };
  logoutAction: () => Promise<void>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!slot.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={compact ? "org-slot org-slot-compact" : "org-slot"} ref={slot}>
      <button
        type="button"
        className="org-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1 truncate">{user.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      </button>
      {open ? (
        <div className="org-menu" id={menuId} role="menu">
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

function NavGroups({
  groups,
  current,
  onNavigate,
}: {
  groups: Group[];
  current: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Primary">
      {groups.map((group) => (
        <div key={group.label || "home"} className="mb-3">
          {group.label ? <p className="type-14 mb-1 px-3">{group.label}</p> : null}
          <ul className="grid gap-1">
            {group.entries.map((entry) => {
              const Icon = entry.icon;
              const active = current(entry.href);
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    prefetch={false}
                    className="nav-pill w-full justify-start"
                    aria-current={active ? "page" : undefined}
                    title={entry.label}
                    onClick={onNavigate}
                  >
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
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = items
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => !entry.permission || user.permissions.includes(entry.permission)),
    }))
    .filter((group) => group.entries.length);

  function current(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1200px)");
    function closeIfDesktop() {
      if (query.matches) setMenuOpen(false);
    }
    query.addEventListener("change", closeIfDesktop);
    return () => query.removeEventListener("change", closeIfDesktop);
  }, []);

  return (
    <div className="app-frame">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <aside className="shell-aside">
        <div className="rail-col">
          <Link href="/dashboard" prefetch={false} className="rail-brand" aria-label="The Scholar">
            <ScholarLogo variant="lockup" alt="" />
          </Link>
          <OrgMenu user={user} logoutAction={logoutAction} />
          <NavGroups groups={visible} current={current} />
        </div>
      </aside>
      <div className="shell-main">
        <header className="shell-top">
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button type="button" className="icon-circle shell-menu-btn" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="nav-overlay" />
              <Dialog.Content className="nav-drawer" aria-describedby={undefined} onCloseAutoFocus={(event) => event.preventDefault()}>
                <div className="nav-drawer-head">
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <Link href="/dashboard" prefetch={false} className="rail-brand min-w-0 flex-1" aria-label="The Scholar" onClick={() => setMenuOpen(false)}>
                    <ScholarLogo variant="lockup" alt="" className="max-h-12 w-auto" />
                  </Link>
                  <Dialog.Close asChild>
                    <button type="button" className="icon-circle" aria-label="Close menu">
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </Dialog.Close>
                </div>
                <OrgMenu user={user} logoutAction={logoutAction} />
                <NavGroups groups={visible} current={current} onNavigate={() => setMenuOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Link href="/dashboard" prefetch={false} className="shell-mark" aria-label="The Scholar">
            <ScholarLogo variant="mark" alt="" />
          </Link>
          <OrgMenu user={user} logoutAction={logoutAction} compact />
        </header>
        <main id="main" className="shell-content">{children}</main>
      </div>
    </div>
  );
}
