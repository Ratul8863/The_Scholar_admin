"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarClock,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  { label: "Administration", entries: [{ href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" }, { href: "/imports", label: "Import", icon: Activity, permission: "import.run" }] },
];

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
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const visible = items
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => !entry.permission || user.permissions.includes(entry.permission)),
    }))
    .filter((group) => group.entries.length);

  const nav = (compact: boolean, onClose?: () => void) => (
    <nav className="flex h-full flex-col" aria-label="Primary">
      <div className="flex items-start">
        <Link
          href="/dashboard"
          aria-label="The Scholar"
          className={cn(
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            compact ? "mx-2 my-3 flex h-11 w-[calc(100%-1rem)] items-center justify-center rounded-xl bg-white px-1 py-1" : "mx-3 my-3 block min-w-0 flex-1 rounded-2xl bg-white px-3 py-2.5",
          )}
        >
          <ScholarLogo variant={compact ? "mark" : "lockup"} alt="" className={compact ? "h-6 w-auto max-w-full" : "max-w-[188px]"} />
        </Link>
        {onClose ? (
          <button type="button" className="mr-2 mt-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-sidebar-text transition-colors duration-[180ms] hover:bg-white/[0.08] hover:text-white" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {visible.map((group) => (
          <div key={group.label || "home"}>
            {group.label && !compact ? <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-sidebar-muted">{group.label}</p> : null}
            <ul className="space-y-0.5">
              {group.entries.map((entry) => {
                const active = pathname === entry.href || (entry.href !== "/dashboard" && pathname.startsWith(entry.href));
                const Icon = entry.icon;
                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      title={entry.label}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-sidebar-text transition-colors duration-[180ms]",
                        active ? "bg-white/[0.12] text-white" : "hover:bg-white/[0.08]",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-colors duration-[180ms]", active ? "text-white" : "text-sidebar-muted group-hover:text-sidebar-text")} />
                      {compact ? <span className="sr-only">{entry.label}</span> : entry.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <button type="button" className="m-2 hidden min-h-10 rounded-xl px-2 py-2 text-left text-xs text-sidebar-muted transition-colors duration-[180ms] hover:bg-white/[0.08] hover:text-sidebar-text md:block" onClick={() => setCollapsed((value) => !value)}>
        {compact ? "Expand" : "Collapse sidebar"}
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-white/5 bg-sidebar motion-safe:transition-[width] motion-safe:duration-[180ms] md:block", collapsed ? "w-[72px]" : "w-[248px]")}>{nav(collapsed)}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[min(100%,280px)] bg-sidebar">{nav(false, () => setOpen(false))}</div>
        </div>
      ) : null}
      <div className={cn("md:pl-[248px] motion-safe:transition-[padding] motion-safe:duration-[180ms]", collapsed && "md:pl-[72px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-3 sm:px-5">
          <Button type="button" variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </Button>
          <p className="hidden text-sm text-muted lg:block">Internal research operating system</p>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/activity" className="hidden text-sm text-muted transition-colors duration-[180ms] hover:text-ink sm:inline">Activity</Link>
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium leading-4">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.roleName}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">Log out</Button>
            </form>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
