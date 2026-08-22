# Stable and dev profile settings

`pnpm dev` keeps its own Electron `userData` directory. A dev launch may now
read a portable projection from the stable profile while keeping the two
profiles operationally independent.

## Startup and precedence

The source is the stable app's early, canonical Electron `userData` path. If a
profile index exists, only its active profile's `orca-data.json` is read. A
legacy root `orca-data.json` is used only when there is no profile index. The
source is read-only; dev startup never calls the profile-creation or migration
writer against it.

The effective dev value is resolved in this order:

```text
dev active profile, isolated baseline
  -> stable active profile, portable allowlist overlay
  -> dev-local override file
```

The dev profile is loaded first so sessions, worktrees, and other excluded
state stay local. The stable overlay replaces only allowlisted portable keys;
the local override wins for keys the dev user has changed.

The override file is `orca-dev-portable-overrides.json` beside the dev active
profile's `orca-data.json`. It is a versioned, secure, durable JSON file. When
a stable projection is available, startup creates an empty marker if needed;
changing a portable setting in dev records only that field in this file.
Restarting dev reapplies the stable projection and then the local override.
There is no write path back to stable.

## Projected state

The allowlist covers user-facing preferences such as theme, language, editor
and terminal appearance, sidebar/layout choices, task/provider defaults,
source-control presentation, safe model/agent selections, notifications, and
selected experimental presentation flags. Nested AI settings are projected
only for agent/model/thinking selections, text instructions, and PR creation
defaults; custom commands and host discovery caches stay local.

The projection intentionally excludes:

- repos, folder/workspace catalogs, worktree metadata, active selections, and
  ID-based filters or ordering;
- workspace sessions, terminals, PTY leases, SSH leases, automation runs, and
  other transient/runtime state;
- runtime environment selection, proxy/provider credentials, account state,
  executable overrides, plugin paths/consents, capability grants, and
  telemetry identity;
- mobile settings and all mobile/runtime sidecars, including
  `orca-devices.json`, `orca-e2ee-keypair.json`, and `orca-runtime.json`.

Malformed stable data contributes no projection. A malformed or unknown-version
dev override file disables inheritance for that launch instead of applying
unknown fields. `ORCA_DEV_USER_DATA_PATH` remains the dev profile boundary;
using the stable path as the dev path is rejected. E2E launches remain fully
disposable and do not inherit the real stable profile.

The stable profile remains the canonical owner of existing mobile pairings.
Dev runtime and mobile operations use the dev `userData` boundary, so ordinary
dogfood does not read, modify, or re-pair stable devices. Keep stable and dev
on different active worktrees/sessions; this feature does not make one runtime
owner-safe for simultaneous use by both instances.

The behavior is covered by the portable projection tests, Store mutation
tests, and startup userData-boundary tests in `src/main/persistence/` and
`src/main/startup/configure-process.test.ts`.
