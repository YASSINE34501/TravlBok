"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SearchFieldRow, SEARCH_FIELD_INPUT_CLASS } from "@/components/search/search-field";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export type SelectedCity = { code: string; label: string };
type CityResult = { code: string; name: string; countryCode: string };

/**
 * Origin/destination field for the Flights search form. Free typing alone
 * used to be sent straight to the Aviasales API as if it were already a
 * valid airport code (`"Casablanca".slice(0, 3)` → "CAS", which isn't even
 * a real searchable code — Casablanca's is "CMN") — that silently produced
 * a 400 from the API, rendered as a misleading "temporarily unavailable"
 * error. This resolves free text against Travelpayouts' own real
 * flightable-city list (via /api/flights/cities) and only ever submits a
 * code the user actually picked from that list.
 */
export function FlightCityCombobox({
  id,
  icon: Icon,
  placeholder,
  selected,
  onSelectCity,
  bare = false,
}: {
  id: string;
  icon: LucideIcon;
  placeholder: string;
  selected: SelectedCity | null;
  onSelectCity: (city: SelectedCity) => void;
  /**
   * Renders the icon + input without their own border/height, for use inside
   * the homepage `SearchFieldShell` which already draws both. Defaults to the
   * original bordered `InputGroup` so `/flights` is unaffected.
   */
  bare?: boolean;
}) {
  const t = useTranslations("Search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [results, setResults] = useState<CityResult[]>([]);

  // Adjusts `query` when `selected` changes for a reason other than the
  // user picking a suggestion themselves (e.g. the swap button) — done
  // during render, not in an effect, per React's guidance on adjusting
  // state derived from props.
  const [prevSelectedLabel, setPrevSelectedLabel] = useState(selected?.label ?? "");
  const selectedLabel = selected?.label ?? "";
  if (selectedLabel !== prevSelectedLabel) {
    setPrevSelectedLabel(selectedLabel);
    setQuery(selectedLabel);
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || query === selectedLabel) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/flights/cities?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { cities: CityResult[] }) => setResults(data.cities ?? []))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selectedLabel]);

  // Stale results from a previous, longer query are simply not shown once
  // the field no longer has enough characters to justify them — avoids
  // needing a second setState just to clear `results` on every keystroke.
  const visibleResults = query.trim().length < 2 ? [] : results;

  function pick(city: CityResult) {
    onSelectCity({ code: city.code, label: `${city.name} (${city.code})` });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery(selectedLabel);
      }}
    >
      <PopoverTrigger
        render={
          <div>
            {bare ? (
              <SearchFieldRow icon={Icon}>
                <input
                  id={id}
                  autoComplete="off"
                  className={SEARCH_FIELD_INPUT_CLASS}
                  placeholder={placeholder}
                  value={query}
                  onFocus={() => setOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                />
              </SearchFieldRow>
            ) : (
              <InputGroup className="mt-1.5 h-10">
                <InputGroupAddon>
                  <Icon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id={id}
                  autoComplete="off"
                  placeholder={placeholder}
                  value={query}
                  onFocus={() => setOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                />
              </InputGroup>
            )}
            {/* Native required-field validation blocks submitting a city
                that was typed but never actually picked from the list. */}
            <input
              type="hidden"
              required
              value={selected?.code ?? ""}
              onChange={() => {}}
            />
          </div>
        }
      />
      <PopoverContent align="start" className="w-72 p-0" initialFocus={false}>
        <Command shouldFilter={false}>
          <CommandList>
            {visibleResults.length === 0 ? (
              <CommandEmpty>
                {query.trim().length < 2 ? t("startTypingCity") : t("noCityMatches")}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {visibleResults.map((city) => (
                  <CommandItem key={city.code} value={city.code} onSelect={() => pick(city)}>
                    <span className="flex-1">{city.name}</span>
                    <span className="text-xs text-muted-foreground">{city.code}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
