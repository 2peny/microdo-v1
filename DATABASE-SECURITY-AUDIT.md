# MicroDo Database and Security Audit — MICRODO-CORE-SEC-005

**Audit date:** 2026-10-26  
**Scope:** Repository architecture, checked-in schema and Firestore rules, authentication/profile code, API routes, admin and analytics data paths, and existing security review. No access to production Namecheap/cPanel, Firebase Console, deployed Firestore, provider logs, or private learner records was available.

## Executive summary

The live architecture cannot be confirmed from this repository alone. The code initializes Firebase Authentication and Firestore in the browser; learning content/progress and analytics are primarily browser `localStorage`. A MySQL-style schema is checked in under `public/schema.sql`, but no runtime MySQL connection or query path was found. The checked-in schema must not be treated as proof of the production database.

Before structural changes, a high-risk demo credential seed was found in the public schema file. The seed contains known weak password hashes for sample identities and is described inaccurately as SHA-256; if imported, these credentials are readily guessable. Do not import this seed or rely on those accounts. Existing production data must not be deleted or automatically altered.

At audit time, the repository did not support a complete three-role platform. This report records that original state first; the post-audit implementation status is recorded at the end. Production Firebase deployment and actual data remain unverified.

## Architecture and data inventory

| Domain | Discovered implementation | Audit status |
|---|---|---|
| Authentication | Firebase Auth email/password and Google popup in `src/lib/firebase.ts`; registration creates a Firebase identity and a `/users/{uid}` profile. | Direct browser SDK integration. Firebase manages credentials and sessions; there was no password reset or verification workflow in the audited code. |
| User profile / roles | Firestore `/users/{uid}`; UID is the document key. Rules permit owner reads/updates, allow only `scholar`/`admin`, and prevent client role changes after creation. | No role array or canonical `SUPER_ADMIN`, `LEARNER`, `PARENT_GUARDIAN` model. |
| Firestore collections | Checked-in rules explicitly describe `/users/{userId}` only; global catch-all denies all other paths. | No guardian relationship or shared learning-record collection was described or authorized by the original rules. |
| MySQL schema | `public/schema.sql` defines `microdo_users`, `microdo_sessions`, `microdo_courses`, `microdo_modules`, `microdo_topics`, `microdo_artifacts`, and `microdo_user_progress`. | No runtime `mysql2` use or DB connection was found. Schema is MySQL/MariaDB syntax despite claiming PostgreSQL compatibility. Only sessions have a declared foreign key; the learning hierarchy/progress tables do not declare relationship constraints. |
| Learning records | Courses and completion/continuation state are read/written in browser storage; topic/mastery structures exist in TypeScript models. | Browser-local, not a shared multi-user backend store. No server-side ownership enforcement or authoritative cross-user progress records found. |
| Owner Backend | Existing `SuperuserDashboard` was mounted, but user lists, roles, status, audit logs, settings and metrics used browser storage or seeded examples. Development middleware exposed synthetic metrics and client log ingestion. | Partial, disconnected, and not authoritative. |
| Guardian functionality | No guardian UI, relationship collection, invitation/approval flow, or authorization rule found. | Missing at audit time. |
| API routes | `server.js` exposes summarization and unload-module POST handlers and static serving. The summarization route forwards text to an AI provider; shared in-memory IP rate limiting was added in prior work. | No identity/session middleware or admin/guardian API was found. The summarization endpoint remains unauthenticated and has only process-local IP controls; production edge/provider quotas remain necessary. |
| Uploads | Document parsing is performed in browser code and course content is persisted locally. | No server-side file storage/database ownership path found. Imported content must remain untrusted when rendered. |

## Database integrity and migration assessment

- Production table/collection existence, schema version, row counts, duplicates, orphan records, ownership mismatches, indexes, backups, and restore procedures cannot be checked without production database access.
- No record-level audit was performed and no user data was changed.
- The checked-in SQL creates a legacy relational model but its ownership and learning foreign keys are incomplete. It included a weak demo-user credential seed and is not suitable as a production migration.
- The original Firestore rules denied every collection except the owner-scoped profile document.
- Do not create duplicate collections/tables or run a migration based solely on the SQL blueprint. First identify the deployed data source and take a verified backup.
- No migration is authorized or executed by this audit. Preserve existing IDs and all existing data; do not auto-merge duplicate identities.

## Security findings

| # | Severity | Finding | Evidence / impact |
|---|---|---|---|
| 1 | HIGH | Public schema includes weak demo-account password hashes | `public/schema.sql` contains a sample-user insert with a known weak hash and a misleading algorithm/password comment. These are not Firebase credentials, and no evidence confirms the schema was imported. If imported, the seeded accounts could be taken over. Do not import the seed; determine whether any environment imported it and disable/reset only those demo accounts after confirming dependencies. |
| 2 | HIGH | Client-side admin and analytics records are not authoritative | `authStorage.ts` and `analyticsEngine.ts` persisted user lists, role/status edits, audit logs, settings, seeded activity and operational jobs in `localStorage`. These values were client-controlled and not valid production metrics. |
| 3 | HIGH | No backend role enforcement or guardian relationship authorization exists | The audited application had no admin/guardian API or relationship model. UI role checks could not protect APIs/data, and the original rules denied non-profile documents. |
| 4 | MEDIUM | Identity/role contracts disagree across layers | Firestore schema/rules use `scholar`/`admin`; TypeScript defines `scholar`, `admin`, `super_admin`, `instructor`, and `auditor`; the request's canonical roles are absent. This risks inconsistent routing and authorization. |
| 5 | MEDIUM | Missing Firestore profiles were silently synthesized in the client | The audited `fetchScholarUserProfile` returned a locally constructed scholar identity after a missing or failed profile read. |
| 6 | MEDIUM | Production database and deployment posture are unverified | No production connection, live Firestore rules, TLS/hosting configuration, secret exposure status, account state, backup, or restore test could be inspected. |
| 7 | MEDIUM | Anonymous AI endpoint abuse remains possible across distributed deployment | The summarization endpoint has an in-process IP limiter from prior remediation. It is not shared across workers/instances and may bucket proxy users together; no auth/edge quota configuration was verified. |
| 8 | LOW | SQL blueprint claims database portability that its syntax does not provide | `public/schema.sql` includes MySQL/MariaDB-only constructs. Importing it into PostgreSQL will fail; blind production import can also create an unintended parallel data model. |
| 9 | LOW | Development admin routes were unauthenticated and disconnected | Vite middleware exposed synthetic metrics and accepted unauthenticated client log events; the production server had no matching route. |

The previously documented stored-content XSS finding and its safe rendering remediation remain applicable; see [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). No live credential rotation, provider-side configuration, or production database action was performed.

## Existing interface inventory

| Interface | Status |
|---|---|
| Learner Dashboard / Course Directory / reader / quizzes / revision | Present; frozen for this patch except security corrections to shared backend services. Data is substantially browser-local. No UI change is authorized here. |
| Owner Backend shell and tabs | At audit time: present but incomplete/disconnected; mutations and analytics used local storage or seeded examples. |
| Parent/Guardian workspace | Missing at audit time. |
| Shared role switcher | Missing at audit time. Existing navigation did not retrieve a complete set of server-authorized roles. |

## Required safe sequence

1. Confirm the deployed data source/schema and remove/quarantine demo credentials in the checked-in schema without altering existing production records.
2. Define one canonical identity/role model while preserving Firebase UIDs and existing learner behavior. Public registration can only request learner or guardian; privileged roles require an authorized process.
3. Implement deny-by-default authorization at a trusted backend boundary. Direct Firestore access must be governed by rules; browser UI gating is not sufficient.
4. Design and version any required schema extension only after checking the real deployed schema, backups, and restore procedures. Do not migrate production from this repository without explicit authorization.
5. Integrate the existing Owner Backend and new guardian interface only against authenticated, authorized, real records. Until backend data exists, show a truthful unavailable/empty state rather than seeded metrics.
6. Test direct-object access, guardian approval/revocation, public role assignment, admin boundaries, and learner regression; do not change learner UI or learning calculations.

## Outstanding production checks

- Identify whether Firebase Firestore, Namecheap MySQL, or both are live; compare actual schema/rules with checked-in configuration.
- Establish if the MySQL seed was imported. If so, assess whether any demo accounts exist and coordinate account disablement/password resets without touching unrelated user data.
- Verify backups and restore drills before structural migration.
- Verify Firebase authorized domains/providers, published Firestore rules, least-privileged operational identities, and MFA for privileged operators.
- Verify Namecheap/cPanel HTTPS, protected environment configuration, deployment/runtime exposure, and log access.
- Configure Gemini key restrictions, billing limits/alerts, and shared edge rate limiting appropriate to the deployment topology.

This is a repository audit, not a live penetration test or production database integrity scan. No claim of complete security or production readiness is made.

## Post-audit patch results

- Removed the weak demo-user inserts from `public/schema.sql` and corrected its header: it is a MySQL/MariaDB reference, not the active application database. Existing imported rows were not altered. A copy in Git history is not erased by this change; assess imported demo accounts before production use.
- Added deny-by-default Firestore rules for profile roles/status, guardian relationships, and admin account-change audit events. Role/status updates require a matching audit event in the same atomic transaction; direct profile updates without that event are denied. The rules are configured for Firebase deployment but have not been deployed or tested against a live Firebase project or emulator.
- Public registration now creates only learner or parent/guardian profiles. Profile read failures no longer synthesize an authenticated learner, and real-account registration no longer falls back to local storage. Password reset uses a generic response; new password accounts request email verification.
- Reused the existing Owner Backend component with Firestore-backed account, role/status, relationship and access-change data. Development-only unauthenticated admin metrics/log routes were removed. Learning analytics, processing operations and platform settings remain unavailable because those backend records/services do not exist.
- Removed browser-seeded analytics events, processing jobs, and fabricated metric floors/defaults. On app startup, only the known demo event/job identifiers are purged from browser storage; genuine learner activity is retained. Missing cohort data is reported as unavailable rather than represented by a fabricated retention percentage.
- Added a guardian workspace and separate learner-consent page. A guardian request does not reveal account existence; only the matching verified learner can approve/reject. Revocations are supported. This is learner consent, not legal guardian verification.
- No new SQL table or migration was created. The new Firestore documents are schemaless and protected by the checked-in rules. No production data was modified.
- Learner course, quiz, mastery, revision and dashboard components were not changed during this patch. Courses and progress remain browser-local, so the Guardian Workspace truthfully reports that progress summaries are unavailable.
- The repository build and TypeScript validation pass, and the current production dependency audit reports no vulnerabilities. These checks do not verify production configuration, deployed rules, provider limits, or live data.

## Visual learning capability

- The current PDF extraction path reads page text; it does not extract embedded figure assets. Existing `SourceReference` records retain document/page/section context, but original textbook figures cannot currently be reused as standalone images by the reader.
- The Key Concepts reader now derives a small set of deterministic, accessible SVG diagrams from lesson/source text: cloud-service component overview (without inferred component links), source-grounded IaaS/PaaS/SaaS comparison, explicitly numbered procedures, and formulas explicitly written as `f(x) = …` or `y = …`.
- Diagram specs are generated locally from existing lesson data and cached in a bounded in-memory map. No schema, external image service, API credential, or database record was added. Unsupported content falls back to the existing lesson text.
- No image-generation provider is configured, so MicroDo-generated illustrations are intentionally skipped rather than blocking lessons. No user-selectable depth/explanation-style preference exists in the current profile model; visuals are selected only when the content provides sufficient evidence.
- This implementation does not regenerate existing lessons or alter quiz, mastery, or progress records. Validate these visual choices against representative source documents before treating them as pedagogically authoritative.
