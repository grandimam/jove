# Jove

**Investigate freely. Merge what matters. Implement when ready.**

A local-first development workspace built around **Project → Work → Investigations**. Explore a codebase in separate conversations, clip useful context, merge attributed findings, and approve an implementation from any investigation.

## Run

Requires **Node.js 22+**, npm, and Git on your PATH.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs on port 4318. The workspace starts empty. Import your local Git codebases to begin.

For a production build:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:4318**. The local server serves the compiled application. Do not expose it to your network or the public internet; it is a single-user desktop-local application, not an authenticated hosted service.

### Open your codebase

A project represents an existing local Git repository. Choose **Import project**, browse to the repository, and select **Import codebase**. Jove derives the project name from the repository folder, shows the canonical path, and prevents opening the same repository twice. Each work item has an isolated Git working copy. Existing example data is hidden in normal use. Set `JOVE_DEMO=1` only when you want the bundled demonstration.

### Work in the console

1. Choose **Import project**, browse to a Git repository, and import it. Create a work item for your question or change.
2. Ask Pi from the console prompt. Output streams into selectable blocks; tool activity appears alongside it. Enter submits; Shift+Enter adds a line; Up recalls your last prompt when the input is empty.
3. Use **Clip** beneath an output block, or select a passage and choose **Clip selection**. Send it to an existing investigation or open a new one beside the original.
4. **Merge** selected findings back into another investigation. Attributed clips remain inline and are included in subsequent Pi context.
5. Choose **Add to queue**, review the handoff, and approve it. Inline actions queue the selected passage or that output block; the investigation toolbar includes recent findings. The queue is a single list with each task’s status and a start, pause, resume, or review button. Click a task title to inspect changes, activity, verification, and its summary.

Every implementation starts a separate subagent with its own handoff and context. Results return inline to the source investigation with a link to the run. Resuming creates a new subagent attempt while preserving existing files. One implementation can write to each worktree at a time. Completed runs retain a stable snapshot of the cumulative worktree diff at that point; it is not a per-task patch.

The console is a Jove interface backed by the Pi harness, not a shell or a screen recording of Pi’s TUI. Output remains ordinary selectable text, enabling inline clips and source links.

## Pi and CLIProxyAPI

Install and authenticate Pi before starting Jove. Tested against the installed Pi 0.80.6. Jove launches `pi --mode rpc`, discovers available models, and uses Pi’s existing authentication. It has no direct Chat Completions adapter or browser API-key setup.

Jove explicitly loads the installed `@router-for-me/pi-cliproxyapi-provider` provider from Pi’s global npm directory. CLIProxyAPI models are preferred, with GPT 6.1 Sol selected when available. OpenRouter models are excluded from Jove’s selector. The provider owns proxy credentials and transport.

Open **Settings** to inspect available models or refresh after changing your Pi login. Choose a model in each console or separately in the implementation handoff.

Optional server settings:

```sh
export JOVE_PI_COMMAND='/absolute/path/to/pi'
# Override automatic provider-extension detection if installed elsewhere:
export JOVE_PI_PROVIDER_EXTENSION='/path/to/pi-cliproxyapi-provider/extensions/index.ts'
# Optional verification command, as JSON argv:
export JOVE_TEST_COMMAND='["npm","test"]'
npm run dev
```

Each request starts a fresh Pi process with the investigation history and attributed clips. Jove owns durable conversation records. Pi runs the model/tool loop, retries, and streaming. Jove waits for `agent_settled`, rather than treating prompt acceptance as completion. Stop/pause/interrupt cancels the corresponding Pi process.

Pi receives Jove’s scoped repository tools through an explicit extension. Investigations can list, read, and search files. Approved implementations can additionally write files and invoke the configured verification command. Unrelated Pi extensions, skills, templates, and built-in shell tools are not loaded.

**Privacy:** Pi sends the supplied context and requested source excerpts through the selected model provider. Credentials remain with Pi. Common secret paths are excluded; secrets embedded in ordinary source are not automatically recognizable.

**Verification approval:** Tests run only when explicitly approved in the handoff. They execute local repository code with the server user’s OS permissions; a Git worktree is not an OS sandbox. Missing configuration or approval is reported as not run.

## What is implemented

- Persistent projects, work, investigations, messages, handoffs, and run state.
- Automatic branch/working-copy creation for each work item, based on repository HEAD. Existing uncommitted changes in the original checkout are left untouched and are not copied into new work.
- Read-only investigation tool set: list, read, literal search. No model shell tool.
- Model selection per investigation and separately for implementation. Switching models never rewrites past messages.
- Whole-message or selected-text clipping, new/existing destination, source attribution.
- Side-by-side investigations, renaming, search, and compact model controls.
- Selective context merge into any investigation in the same work, with source-message references and confidence caveats.
- Editable approved handoff, compact implementation queue, direct start/pause/resume controls, scoped writes, diff/tests/activity/summary, interruption/resumption.
- Separate subagent processes for every implementation attempt, with results attributed back to the source investigation.
- One writer per work, including stopping operations; one server per data directory.
- File-content freshness fingerprints and stale-evidence warnings after edits.
- Before-write recovery copies for live overwrites, plus read-before-write conflict checks.
- Safe archive that preserves all files. Advanced details reveal branch, path, revision, and recovery checkpoints.
- Local-origin/Host restrictions, JSON-only mutations, path traversal/symlink rejection, and common secret-file exclusions.

## Storage and recovery

By default, data lives in **~/.jove**. Override with `JOVE_DATA_DIR=/absolute/path`.

- `state.json`: atomic persistent records, including conversations.
- `workspaces/`: managed isolated Git working copies.
- `checkpoints/`: original file contents saved before Pi implementation overwrites. Find the exact paths in **Work details**. Restore manually after reviewing the diff; there is no automatic destructive restore.
- `server.lock`: excludes a second Jove server using the same data directory. A stale lock is recovered only when its recorded process is no longer alive.

A restart marks running and paused runs interrupted, preserves edits, and requires explicit resume for those attempts. Waiting tasks keep their order. If a run was active at restart, the queue switches to manual mode. Failure or interruption also disables automatic starting so later work does not silently continue over an unfinished task. Start an individual waiting task with its play button when the worktree is available. Archive never deletes a branch or working copy. No merge, push, cleanup, or deployment happens automatically.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests cover real Git isolation, persistence/restart, clipping/provenance, context merge, child implementation, true regression test execution, writer exclusion, pause/resume, archival, secret filtering, symlink/path protections, process locking, Pi tool permission boundaries, JSONL protocol fixtures, and frontend workflow interactions against the real local API.

## Architecture

- React + TypeScript + Vite UI; responsive dark workspace inspired by the supplied references.
- Express + Node.js local API.
- Atomic JSON state store, Git CLI worktree isolation.
- Pi RPC harness with a 32-turn limit, cancellation, deadlines, model discovery, and streamed output.
- Node test runner with real temporary Git repositories and mock Pi RPC subprocess fixtures.
- React Testing Library + JSDOM for UI workflows.

The product source is [docs/PRD.md](docs/PRD.md). See [docs/VERIFICATION.md](docs/VERIFICATION.md) for verification scope and known limitations.

## V1 limitations

This is a local single-user workspace. It uses fresh Pi contexts with the latest 24 conversational messages and up to 30 attributed context artifacts, rather than resuming native Pi session files. Merge previews select source findings, rather than asking a second model to summarize them. CLI/Git must be available locally. Windows installation, large-repository performance, and every model in a proxy catalog require further verification. The optional deterministic demo is enabled only with `JOVE_DEMO=1`.

Read-only tools and scoped writes are application-level checks, not OS-level isolation. Untrusted repository code must not be executed on a sensitive host. Recovery backups help preserve originals but are not a replacement for your normal Git/backup practices.

## Interface styling

Jove uses the Graphite & Chalk design system with Tailwind CSS v4. Semantic colors and font families are defined in `src/design-system/graphite.css`; shared utility recipes are in `src/design-system/graphite.ts`. Inter and IBM Plex Mono are bundled locally. The legacy application and polish stylesheets have been removed.
