# MicroDo Security Audit — MICRODO-SEC-001

**Review date:** 2026-10-26  
**Scope:** Repository source, current frontend build, reachable Git history, local deployment documentation and configuration. No live Namecheap/cPanel, Firebase Console, or deployed service access was available.

## Executive summary

The review found one high-severity stored-content HTML injection risk, one medium-severity anonymous AI-quota abuse risk, and two low-severity client-side authentication/privileged-access weaknesses. Local profile and role state are browser-controlled and must not be treated as authentication. No private credentials were identified in the inspected source, build output, or reachable Git history. Firebase web configuration is client-visible configuration, not a private server credential.

## Findings

| # | Severity | Finding | Evidence and impact |
|---|---|---|---|
| 1 | HIGH | Imported lesson text can execute as HTML | `MarkdownViewer` interpolated content into HTML and assigned it through `dangerouslySetInnerHTML` without sanitization. Imported lesson content could therefore run script in the application origin when rendered. Reviewed location before fix: `src/components/MarkdownViewer.tsx:100-110`. |
| 2 | MEDIUM | Anonymous callers could consume paid Gemini quota | `/api/summarize-module` forwarded caller-provided text to Google using the server-side key without authentication or rate limiting. This exposed quota/billing abuse, not stored user data. Production Node route reviewed at `server.js:319-321`; equivalent Express and development middleware routes are also affected. |
| 3 | LOW | Local superuser shortcut bypassed authentication | The sign-in UI created a synthetic `super_admin` identity and stored it locally. The Owner Backend UI trusted local state. Review found no protected server-side admin endpoints behind that UI, so this exposed local controls rather than a verified server privilege. Reviewed location before fix: `src/components/AuthOverlay.tsx:782-810`. |
| 4 | LOW | Local sign-in fallback did not verify passwords | When Firebase authentication failed, the local fallback selected a stored profile by email/username without verifying the supplied password. This only authenticated browser-local profile state, not a server-backed account session. Reviewed location before fix: `src/components/AuthOverlay.tsx:171-178`. |

## System inventory

- **Authentication:** Firebase Authentication supports email/password and Google sign-in. The application also creates guest/local sessions and stores a synthetic user object in `localStorage`.
- **Backend:** `server.js` exposes module summarization and unload routes plus static handling. `server.ts` and Vite development middleware also define summarization routes. The summarization endpoint has no caller authentication; the review did not find it exposing database records or another protected operation. No server-side admin API was found.
- **Roles and Owner Backend:** Role/permission controls and dashboard data are client-side/local-storage based. UI visibility is not server authorization.
- **Uploads and course data:** PDF/DOCX/text processing occurs in the browser; extracted learning material is stored in browser `localStorage`. The HTML injection finding applies to rendering imported content.
- **Database:** Runtime profile access uses Firestore. Checked rules default-deny other documents and constrain profile access to the authenticated UID; owners cannot modify an existing role. A checked-in MySQL schema was not connected to a runtime query path in the inspected servers.
- **Secrets:** No private credentials were identified in inspected source, current build output, or reachable history. `.env.example` uses placeholders and `.env` is ignored. The server reads `GEMINI_API_KEY` from its environment. Firebase client configuration is public by design.
- **Dependencies:** The package audit reported six high-severity advisory entries. The review did not establish exploitability for each entry or whether affected code paths are reachable in production; treat this as a dependency-maintenance action, not six confirmed application vulnerabilities.
- **Deployment:** Repository documentation describes cPanel Node.js and static deployment, but does not establish which mode is live. Live hosting, TLS, environment configuration, Firebase provider settings, authorized domains, and deployed Firestore rules were not verified.

## Safe code remediation

1. Render untrusted Markdown text as React text rather than raw HTML; keep math rendering limited to KaTeX-generated markup with its safe defaults.
2. Remove the synthetic superuser shortcut. Treat local roles and permission values as untrusted and keep the Owner Backend unavailable absent a verified authenticated identity.
3. Make the local passwordless fallback explicitly guest/local-only, not a sign-in path. Do not let it imply server authentication or grant privileged UI access.

These changes do not require changing learning content, scoring, or progress calculations.

## Remediation completed

- Replaced raw HTML rendering of lesson text with React-rendered text and formatting. Only KaTeX-generated markup is inserted as HTML, with KaTeX's `trust` option explicitly disabled.
- Removed the synthetic superuser sign-in. The Owner Backend entry and dashboard now require a Firebase auth-state profile with an explicitly provisioned admin role and matching Firebase UID. This is a UI gate only; no server-side admin API was found to authorize.
- Removed local-profile password fallback for account sign-in. Firebase remains the account sign-in path; the explicitly labelled guest/local mode remains available.
- Added an in-memory per-IP sliding-window limit of 30 summarization requests per 15 minutes in the production Node server, Express server, and Vite development middleware. Excess requests receive HTTP 429 and `Retry-After` before body parsing. The limiter is bounded to 10,000 tracked client addresses.
- Applied non-breaking package updates and overrode the vulnerable transitive gRPC client to a patched 1.x release. `npm audit` reports zero vulnerabilities after the updates.
- Reduced decorative gradients, status glyphs, resource icons, and icon-led labels across the dashboard, navigation, and study-resource panels. Kept icons that communicate direct actions such as back, close, menu, and completion.

## Manual production checks

No private key requiring rotation was identified, so this review does not recommend revoking or rotating a credential. Before deployment, an operator should verify:

- Namecheap/cPanel is configured for HTTPS and that runtime secrets are set as protected environment variables, not uploaded as public files.
- Firebase Authentication providers and authorized domains match the intended production domain.
- Privileged Firebase accounts have multifactor authentication enabled and enforced where supported; this was not verified in source or live provider settings.
- The deployed Firestore rules match the reviewed default-deny rules.
- The Google AI provider key is restricted to the needed service/API and has usage budgets or alerts configured. The code now rate-limits the anonymous summarization feature, but account-level quotas are still necessary.
- If cPanel runs multiple workers or proxies requests through a shared address, configure provider/edge rate limiting as well; the in-process limiter is not shared across instances.
- Provider usage/logs show no unexpected activity if a secret is later found to have been exposed outside the inspected repository/history.

No live provider changes were made or could be verified from this workspace.

## Verification limits

This was a source/configuration review, not a live penetration test. Production hosting configuration, deployed Firebase settings, active user data, and deployed provider usage were not verified. A passing build does not establish that the deployed service is secure.

The production Node server and Vite development middleware limiters were exercised locally: 30 invalid summarization requests reached normal validation, and request 31 received HTTP 429 with `Retry-After` in each environment. This verified both paths without invoking the AI provider.
