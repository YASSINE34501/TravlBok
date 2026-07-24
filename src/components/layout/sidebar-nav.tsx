"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItem {
  href: string;
  label: string;
  // A pre-rendered icon element (built server-side in *-nav.tsx), not a bare
  // component reference — a raw component function isn't serializable across
  // the Server Component -> Client Component (AppShell) prop boundary.
  icon: ReactNode;
  exactMatch?: boolean;
}

interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

function isItemActive(pathname: string, item: SidebarNavItem) {
  if (item.exactMatch) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarNav({
  groups,
  collapsed = false,
  onNavigate,
}: {
  groups: SidebarNavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="flex flex-col gap-1">
          {group.label && !collapsed && (
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-[1.1rem] [&_svg]:shrink-0",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export { SidebarNav };
export type { SidebarNavItem, SidebarNavGroup };
