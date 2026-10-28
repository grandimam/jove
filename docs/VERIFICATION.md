# Verification record

## Completed

- TypeScript strict checking and production Vite build.
- 32 automated integration, protocol, repository safety, and frontend tests passed.
- Frontend tests use React Testing Library/JSDOM and the actual local API. They cover inline clipping, preserved drafts, attributed merge, child-subagent implementation, real fixture test execution, importing a repository, and queue hold/reorder/remove/start/review.
- Backend queue checks cover ordering, persistence, single-writer ownership, cancellation, and fresh subagent attempts. Git operations and deterministic implementation tests use isolated temporary repositories.
- Pi JSONL subprocess fixtures exercise model discovery, streaming, read-only and writing tool permissions, settlement, errors, cancellation, and timeouts.
- Real installed Pi plus CLIProxyAPI smoke check discovered 40 models, selected `pi:cliproxyapi:gpt-6.1-sol`, read a temporary fixture through `read_file`, and returned its exact token. No user codebase was modified.
- Local headless Chrome checked selected-text clipping across state polling, attributed side-by-side consoles, exact clipped-artifact handoff provenance, held queue, reordering, subagent completion, review affordance, and mobile width. No browser JavaScript errors or horizontal document overflow occurred.

Reproduce browser checks after building with `node --import tsx scripts/check-console.ts`. It starts an isolated fixture server and writes desktop/mobile screenshots to `/tmp/jove-queue-desktop.png`, `/tmp/jove-queue-review.png`, `/tmp/jove-queue-mobile.png`, and `/tmp/jove-console-mobile.png`.

## Behavior and limits

- Each approved implementation runs in a separate subagent process. Resume creates a fresh attempt, preserves existing edits, and returns an attributed result to the originating investigation.
- Queue automatic starting is configurable per worktree. Paused work retains ownership; failure, interruption, or restart during active work switches the queue to manual mode. Waiting tasks retain their order.
- Completed-run diffs are stable snapshots of cumulative worktree changes, not isolated per-task patches.
- The deterministic demo proves orchestration and fixture editing; the live model smoke check proves read-only proxy inference. Neither proves successful arbitrary implementation by every available model.
- Windows installation, large repositories, and every proxy model remain unverified.
- Tool restrictions are application-level safeguards, not OS isolation. Approved verification executes repository code with the local server user's permissions.
- Archive preserves branches and files. No merge, push, cleanup, or deployment happens automatically.
