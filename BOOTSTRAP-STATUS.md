# BOOTSTRAP-STATUS

## Phase 0 prepared

The bootstrap contains the authoritative product/data/draw/UX/architecture/acceptance documents, a minimal Vite + TypeScript skeleton, fake schema-compatible data, CI, and GitHub Pages deployment workflow.

## Important 2026-08-24 revisions

- Added optional category equalization, default OFF.
- Added optional difficulty equalization, default OFF.
- Added normative handling of multi-theme entries via exclusive per-cycle category assignment when category balancing is active.
- Added combined category × difficulty mode.
- Made mobile-first behavior a blocking acceptance requirement, including 320/375/390/430 px smartphone widths and landscape.
- Removed any requirement that the repository itself be public.

## Not yet validated in this environment

No `package-lock.json` is included because dependency installation was not completed in the preparation environment. Mission M0 must install the pinned dependencies, generate/commit the lockfile, and run the full verification suite. If a pinned version no longer resolves, Codex may update only to the nearest current stable compatible version and must report the change; it must not re-architect the stack.

The final application UI and draw engine are intentionally not implemented yet.
