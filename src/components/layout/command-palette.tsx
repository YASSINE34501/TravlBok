"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { SidebarNavGroup } from "@/components/layout/sidebar-nav";

function CommandPalette({ navGroups }: { navGroups: SidebarNavGroup[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-start">Search…</span>
        <CommandShortcut>⌘K</CommandShortcut>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {navGroups.map((group, index) => (
              <CommandGroup key={group.label ?? index} heading={group.label ?? "Navigate"}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => goTo(item.href)}
                    className="[&_svg]:size-4"
                  >
                    {item.icon}
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export { CommandPalette };
