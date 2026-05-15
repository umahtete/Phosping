# LuxUp Tutor — Action Plan

Generated: 2026-05-15

## Overview

LuxUp Training is a Course Producer/Distributor (B2B) that sells AI-powered courses to education institutions via Moodle/IOMAD. OpenMAIC (forked as "Phosping") serves as both the course generator and AI Tutor, whitelabelled as **LuxUp Tutor**.

Live at: tutor.luxuptraining.com

---

## Phase 1: Whitelabel & Access Control (1-2 days)
**Status: ✅ Complete** (commit `fefe8a2`, pushed 2026-05-15)

Get the platform usable for the in-house team immediately.

- [x] Replace all "OpenMAIC" branding with "LuxUp Tutor" across the codebase
- [x] Design placeholder logo, favicon, and sidebar branding reflecting "Light Up" theme
- [x] Fix broken access-code system (wrong cookie format, missing endpoint, middleware passthrough)
- [x] Wire access-code-guard to enforce auth on homepage only, allow unauthenticated access to `/classroom/[id]/*`
- [ ] Set ACCESS_CODE env var in Coolify (manual step — needs deployment to take effect)

## Phase 2: Storage Hardening (2-3 days)
**Status: ✅ Complete** (commit `b2af791`, pushed 2026-05-15)

Make persistence reliable for production use.

- [x] Expand Prisma schema: add `createdAt`, `updatedAt`, `title`, `status`, `userId`, `ltiContextId` fields
- [x] Update storage services (`storage-service.ts`, `storage-service-server.ts`) with typed `SaveClassroomData` interface
- [x] Auto-save classrooms to PostgreSQL after server-side generation completes (non-fatal fallback)
- [x] Ensure `/classroom/[id]` works from PostgreSQL — existing client-side fallback already reads from `GET /api/classroom?id=X`
- [x] Server-side media files served via `/api/classroom-media/{id}/...` from persistent `/app/data` volume
- [x] Custom migration runner (`scripts/migrate.js`) runs at Docker container startup before `server.js`
- [ ] **Known limitation:** Client-side generated media (manual course creation) stays in IndexedDB — needs upload-to-server feature for full coverage

## Phase 3: LTI 1.3 Integration (5-7 days)
**Status: Pending**

Core integration with Moodle.

- [ ] Add LTI 1.3 libraries
- [ ] LTI platform registration in Moodle
- [ ] Implement OIDC launch flow (`/api/lti/launch`)
- [ ] Store LTI context in database
- [ ] Implement Deep Linking for specific classroom launches
- [ ] Middleware: validate LTI sessions for `/classroom/[id]` access
- [ ] LTI configuration management

## Phase 4: Grade Passback (3-5 days)
**Status: Pending**

Connect quiz results to Moodle gradebook.

- [ ] Implement LTI AGS (Assignment and Grade Services)
- [ ] Map quiz scores → LTI AGS line items
- [ ] Grade submission on quiz completion
- [ ] Overall course completion grade passback

## Phase 5: SiteONTHEGO Integration (2-3 days)
**Status: Pending**

Turnkey domain provisioning for B2B clients.

- [ ] API integration with SiteONTHEGO
- [ ] Automated Moodle + LuxUp Tutor setup per-tenant
- [ ] Per-tenant configuration management

---

**Estimated total: 13-20 days of focused engineering.**
