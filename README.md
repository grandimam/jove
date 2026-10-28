# Jove

**Investigate freely. Merge what matters. Implement when ready.**

A local-first development workspace built around **Project → Work → Investigations**. Explore a codebase in separate conversations, clip useful context, merge attributed findings, and approve an implementation from any investigation.

## Run

Requires **Node.js 22+**, npm, and Git on your PATH.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs on port 4318. On first launch Jove creates a small, local credit-engine example and an isolated working copy, so the entire workflow can be tried without API credentials.

For a production build:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:4318**. The local server serves the compiled application. Do not expose it to your network or the public internet; it is a single-user desktop-local application, not an authenticated hosted service.

### Try the core loop

1. Open **Data flow** alongside Main with the split-pane button.
2. Select text in a message and click **Clip**, or clip the whole message. Create a new investigation or choose an existing one.
3. Ask a follow-up. Each investigation keeps its own history and model.
4. Click **Merge**, select findings and a destination, then review the attributed context artifact. This does not apply code changes.
5. Choose **Implement** from any investigation. Edit the objective, constraints, criteria, assumptions, and model; approve the handoff.
6. Review activity, actual changes, terminal output, tests, and summary in the focused implementation view. Pause, interrupt, or resume with follow-up instructions.

**Demo mode is intentionally deterministic.** It edits the bundled example to handle missing financial history as ineligible and runs real regression tests in its Git working copy. It does not interpret arbitrary objectives and cannot implement your own repository. The handoff explicitly labels this behavior. Use a configured provider for open-ended work.

## Live provider

Jove includes one configurable **OpenAI-compatible Chat Completions adapter**, plus the local demo. Models/endpoints must support function tool calls. Set credentials in your server environment before launching:

```sh
export JOVE_API_KEY='your-provider-key'
export JOVE_MODEL='your-provider-model-id'
# Optional; defaults to https://api.openai.com/v1
export JOVE_BASE_URL='https://your-provider.example/v1'
# Optional trusted verification command, as JSON argv (not a shell string):
export JOVE_TEST_COMMAND='["npm","test"]'
npm run dev
```

Use your own model/provider values. Credentials are never stored in browser storage or committed state. Model availability is shown in Settings; endpoint and tool support errors are surfaced on the request. A provider's presence does not prove credentials have been externally verified.

**Privacy:** Choosing the live provider sends the investigation context, handoff, and requested source-file excerpts to the configured endpoint. Open only repositories you are authorized to share with that provider. Common secret paths are excluded, but Jove cannot recognize every secret embedded in ordinary source files.

**Verification approval:** Live runs cannot execute the configured test command unless you explicitly check the handoff approval box. Repository code, including model-generated tests, executes with the server user's OS privileges. A Git working copy is **not a security sandbox**. Approve execution only for trusted repositories, or run Jove inside a disposable container/VM. Without approval/configuration, tests are shown as not run, never passed.

## What is implemented

- Persistent projects, work, investigations, messages, handoffs, and run state.
- Automatic branch/working-copy creation for each work item, based on repository HEAD. Existing uncommitted changes in the original checkout are left untouched and are not copied into new work.
- Read-only investigation tool set: list, read, literal search. No model shell tool.
- Model selection per investigation and separately for implementation. Switching models never rewrites past messages.
- Whole-message or selected-text clipping, new/existing destination, source attribution.
- Side-by-side investigations, renaming, search, and compact model controls.
- Selective context merge into any investigation in the same work, with source-message references and confidence caveats.
- Editable approved handoff, fresh implementation context, scoped writes, diff/tests/activity/summary, interruption/resumption.
- One writer per work, including stopping operations; one server per data directory.
- File-content freshness fingerprints and stale-evidence warnings after edits.
- Before-write recovery copies for live overwrites, plus read-before-write conflict checks.
- Safe archive that preserves all files. Advanced details reveal branch, path, revision, and recovery checkpoints.
- Local-origin/Host restrictions, JSON-only mutations, path traversal/symlink rejection, and common secret-file exclusions.

## Storage and recovery

By default, data lives in **~/.jove**. Override with `JOVE_DATA_DIR=/absolute/path`.

- `state.json`: atomic persistent records, including conversations.
- `workspaces/`: managed isolated Git working copies.
- `checkpoints/`: original file contents saved before live-provider overwrites. Find the exact paths in **Work details**. Restore manually after reviewing the diff; there is no automatic destructive restore.
- `server.lock`: excludes a second Jove server using the same data directory. A stale lock is recovered only when its recorded process is no longer alive.

A restart marks unfinished runs interrupted, preserves edits, and requires explicit resume. Archive never deletes a branch or working copy. No merge, push, cleanup, or deployment happens automatically.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests cover real Git isolation, persistence/restart, clipping/provenance, context merge, child implementation, true regression test execution, writer exclusion, pause/resume, archival, secret filtering, symlink/path protections, process locking, provider permission boundaries, mocked provider tools, and frontend workflow interactions against the real local API.

## Architecture

- React + TypeScript + Vite UI; responsive dark workspace inspired by the supplied references.
- Express + Node.js local API.
- Atomic JSON state store, Git CLI worktree isolation.
- Provider-neutral records and bounded function-tool loop (16 rounds).
- Node test runner with real temporary Git repositories and mock provider HTTP fixtures.
- React Testing Library + JSDOM for UI workflows.

The product source is [docs/PRD.md](docs/PRD.md). See [docs/VERIFICATION.md](docs/VERIFICATION.md) for verification scope and known limitations.

## V1 limitations

This is a functional V1 foundation, not a production-hardened multi-user service. There is one configured live endpoint/model per server; a full multi-provider credential manager is not included. Provider output is returned after a response/tool round rather than token-streamed. The UI supports selected text and messages, but does not yet include a standalone file browser or editor selection integration. Merge previews select source findings, rather than using a second model to synthesize summaries. CLI/Git must be available locally. Windows installation and real external-provider calls require further verification. Context size is bounded by recent messages, not automatic token-aware summarization.

Read-only tools and scoped writes are application-level checks, not OS-level isolation. Untrusted repository code must not be executed on a sensitive host. Recovery backups help preserve originals but are not a replacement for your normal Git/backup practices.
