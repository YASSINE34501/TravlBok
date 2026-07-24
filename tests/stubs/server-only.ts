// Stub for the "server-only" package under Vitest. The real package throws
// unconditionally when required outside a bundler that respects its
// "browser" package.json condition (webpack/Next) — under plain Node (which
// is what Vitest runs on), that would make every domain file this test
// suite imports throw on import. This no-op re-establishes the same
// "importable under Vitest, blocked in an actual client bundle" contract:
// Next's own bundler still applies the real package's browser-field guard
// for the app itself, since this alias only exists in vitest.config.ts.
export {};
