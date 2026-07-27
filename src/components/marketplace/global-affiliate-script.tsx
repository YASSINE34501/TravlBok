import Script from "next/script";

// Travelpayouts Drive integration — do not change this URL/ID. Mounted once,
// site-wide, in the locale root layout. `id` gives next/script its own
// dedup (it tracks injected script ids across client-side navigation and
// never re-inserts one already present), so this is safe even though the
// root layout re-renders on every locale-prefixed route.
const DRIVE_SCRIPT_URL = "https://emrldtp.com/NTU0NTk0.js?t=554594";

export function GlobalAffiliateScript() {
  return (
    <Script id="travelpayouts-drive" src={DRIVE_SCRIPT_URL} strategy="afterInteractive" />
  );
}
