"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav, type SidebarNavGroup } from "@/components/layout/sidebar-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { isRtlLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function AppShell({
  brand,
  navGroups,
  topbarActions,
  breadcrumb,
  children,
}: {
  brand: React.ReactNode;
  navGroups: SidebarNavGroup[];
  topbarActions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mobileSheetSide = isRtlLocale(locale) ? "right" : "left";

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b px-4",
            collapsed && "justify-center px-2"
          )}
        >
          {brand}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav groups={navGroups} collapsed={collapsed} />
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="w-full"
            onClick={() => setCollapsed((previous) => !previous)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 rtl:rotate-180" />
            ) : (
              <PanelLeftClose className="size-4 rtl:rotate-180" />
            )}
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={mobileSheetSide} className="w-72 gap-0 p-0">
              <SheetHeader className="h-16 justify-center border-b px-4 py-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {brand}
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-3">
                <SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">{breadcrumb}</div>

          <CommandPalette navGroups={navGroups} />

          <div className="flex items-center gap-1.5">{topbarActions}</div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export { AppShell };
