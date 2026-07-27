"use client";

import { useEffect, useState } from "react";

type ScriptStatus = "idle" | "loading" | "ready" | "error";

// Module-level cache so multiple WidgetContainer mounts (or remounts across
// client-side navigation) never inject the same provider script twice.
const scriptStatusCache = new Map<string, ScriptStatus>();

/**
 * Lazily loads an external widget script exactly once per `src`, tracked
 * across mounts/unmounts. Cleans up only its own load/error listeners on
 * unmount — the injected <script> tag itself is left in place so a later
 * remount of the same widget doesn't refetch it.
 *
 * Assumes `src` is stable for the lifetime of a given hook instance (pass a
 * `key` at the call site if a widget can switch to a different script URL
 * without unmounting).
 */
export function useExternalScript(src: string | undefined): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() =>
    src ? (scriptStatusCache.get(src) ?? "loading") : "idle"
  );

  useEffect(() => {
    if (!src) return;

    const cached = scriptStatusCache.get(src);
    if (cached === "ready" || cached === "error") return;

    scriptStatusCache.set(src, "loading");

    let script = document.querySelector<HTMLScriptElement>(
      `script[data-travlbok-widget-src="${src}"]`
    );
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.travlbokWidgetSrc = src;
      document.body.appendChild(script);
    }

    function handleLoad() {
      scriptStatusCache.set(src!, "ready");
      setStatus("ready");
    }
    function handleError() {
      scriptStatusCache.set(src!, "error");
      setStatus("error");
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [src]);

  return src ? status : "idle";
}
