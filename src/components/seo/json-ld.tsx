/**
 * Renders a single JSON-LD `<script>` tag. `dangerouslySetInnerHTML` is the
 * only way React can emit a `<script type="application/ld+json">` — this is
 * Next.js's own documented pattern for structured data, not a workaround.
 * Safe here specifically because `data` is always a server-constructed
 * object built from real database fields (see callers), never raw
 * user-supplied HTML/markup — `JSON.stringify` on a plain object cannot
 * produce a `</script>`-breakout or execute as markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
