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

## M0 validation completed

M0 generated `package-lock.json` and validated dependency installation, type checking, tests, build, CI, and GitHub Pages.

M1 implements the functional V1, deterministic draw engine tests, mobile-first UI, and installable offline PWA. The bundled corpus remains intentionally fake; the final 5,000-entry corpus is a later mission.
