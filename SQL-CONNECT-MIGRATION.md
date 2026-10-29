# MicroDo Firebase SQL Connect migration

## What this implements

This repository now contains the source-controlled Firebase **SQL Connect** backend
definition in `/Users/work/Documents/microdo/microdo-v1/microdo-v1/dataconnect`.
SQL Connect uses a Firebase-managed GraphQL API over Cloud SQL for PostgreSQL; the
schema is translated to PostgreSQL tables and connector operations become the only
client-callable API surface.

Firebase Authentication remains responsible for identities, passwords, session
tokens, password resets, and email verification. PostgreSQL stores application data
only. Do not copy password hashes, Firebase ID tokens, refresh tokens, or Auth
sessions into Cloud SQL.

## Provisioning required before deployment

On October 28, 2026, project `gen-lang-client-0814085166` has no SQL Connect
service. Creating Cloud SQL is billable and chooses a location that cannot be
inferred from this codebase, so it was intentionally not auto-provisioned.

1. In Firebase Console, open **Build → SQL Connect** and create a service backed by
   a new or existing Cloud SQL for PostgreSQL instance. Choose the production
   location deliberately; keep the service and Cloud SQL instance co-located.
2. Choose these repository names or update
   `/Users/work/Documents/microdo/microdo-v1/microdo-v1/dataconnect/dataconnect.yaml`
   to exactly match the generated values:
   - service ID: `microdo`
   - location: `us-central1`
   - Cloud SQL instance ID: `microdo-postgres`
   - PostgreSQL database: `microdo`
3. Confirm your deploying identity has the Firebase SQL Connect schema/connector
   permissions and Cloud SQL Admin access required for migrations.

The same setup can be initiated interactively with:

```bash
npx firebase-tools init dataconnect --project gen-lang-client-0814085166
```

Do not overwrite the checked-in schema or connector directories when prompted.

## Review and deploy

Always inspect generated DDL before applying it:

```bash
npm run sqlconnect:diff
npm run sqlconnect:migrate
npm run deploy:sqlconnect
npm run sqlconnect:sdk
```

`schemaValidation: COMPATIBLE` is intentional. It avoids destructive drops for
production data. Do not switch to `STRICT` against a populated database without a
tested backup and restore plan.

## Current client migration boundary

The current React application still reads and writes user-scoped browser storage.
The `WorkspaceSnapshot` table and the three `workspace` connector operations are a
non-destructive bridge for migrating that existing tree:

1. On first authenticated SQL Connect load, call `UpsertMyProfile` using Firebase
   Auth profile data.
2. If `GetMyWorkspace` has no snapshot, upload the current UID-scoped local course
   tree, completed artifact IDs, and continue position with `UpsertMyWorkspace`.
3. On successful upload, retain local data as an offline cache; mark the account as
   migrated only after a subsequent successful `GetMyWorkspace` read.
4. During the next UI migration, replace snapshot writes with the normalized
   `Course`, `UploadedDocument`, `Module`, `Topic`, `LessonArtifact`, completion,
   mastery, quiz-attempt, and position records.
5. Retire `WorkspaceSnapshot` only after all active clients have moved to normalized
   reads/writes and a data-retention/export policy is in place.

The generated SDK is ignored because it is reproducible. After provisioning and
deployment, run `npm run sqlconnect:sdk`; it writes the SDK to
`/Users/work/Documents/microdo/microdo-v1/microdo-v1/src/dataconnect/generated`.
The Firebase generator adds a local `file:` dependency automatically. Do not commit
that dependency while generated sources are ignored: a clean checkout could not run
`npm install` before generation. Add and commit both the generated package and its
dependency together only when the React app starts importing `@microdo/dataconnect`.

## Security model

All connector operations use `USER_EMAIL_VERIFIED`, and ownership is derived using
`auth.uid` on the server. No query or mutation takes a caller-provided user ID.
This is essential: a `USER` access level alone authenticates a caller but does not
automatically constrain rows to that caller.

The client connector intentionally exposes only migration-snapshot/profile
operations. Admin operations, cross-user guardian views, role grants, document
processing job transitions, and signed Cloud Storage upload URLs should be exposed
later through separate narrowly scoped connectors or a server-side Admin SDK worker.

## File storage and workers

Do not store PDF, DOCX, or raw binary document bytes in PostgreSQL. Upload files to
Cloud Storage, persist only `UploadedDocument.storageObjectPath` and metadata here,
then let an authenticated background worker create `ProcessingJob`, extracted text,
modules, topics, and lesson artifacts. The worker must use Firebase Admin/IAM,
validate document ownership, cap file size/type, virus-scan where required, and make
job processing idempotent.