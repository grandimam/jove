# Paper UI implementation

Design source: [Paper design system](paper-design-system.md). The supplied image guides composition; the specification takes precedence for fonts, semantics, and application state.

## Implemented

- Paper color tokens, explicitly bundled Geist/Geist Mono, pinned Lucide version, and custom monochrome raven SVG.
- Tailwind v4 component styling in `src/design-system/paper.ts` and JSX. `paper.css` is limited to tokens, Tailwind setup, and base/accessibility rules; the old Graphite stylesheet/recipes are removed. Existing `graphite` call sites import the Paper helper under a compatibility alias, not a second theme.
- Structured findings, safe text-only markdown/list rendering, syntax-colored excerpts, recorded tool-activity disclosures, and neutral output/version status.
- Investigation-scoped output tab/section persistence and contextual implementation options. Multi-output consolidation is explicitly unavailable rather than presented as working.
- Framed desktop workspace, neutral project/work icons, work heading, investigation tabs, editorial conversation, and pinned composer.
- Pointer- and keyboard-resizable navigation/conversation/output regions. Widths, navigation selection, navigation collapse, and work disclosure state persist locally.
- Narrow-window conversation/output switching, visible focus states, and reduced-motion treatment.
- Settings/providers inside the local account popover, including modal focus restoration.
- Investigation-scoped Output, Files, Diff, and History views. Empty outputs remain empty; changing investigations changes both conversation and output.
- Proposed file plans explicitly distinguished from recorded changes. Acceptance criteria are not presented as passed tests.
- Version history, restore, manual editing, and a stable output-version snapshot while reviewing an implementation handoff.
- Recorded Git diff with split/unified layouts, line numbers, syntax colors, actual file states, and existing change-trace / investigate actions.
- Existing clipping, explicit findings merge, implementation queue, provider settings, and source inspection remain available. Investigation actions are in the tab-row overflow menu.

## Not delivered by this visual implementation

- Multi-output consolidation, material-conflict review, and the corresponding “Implement with others…” workflow.
- Separate Git working copies for each independent implementation attempt. The existing backend still serializes writers within a Work-level working copy; this is not a sandbox.
- Moving all implementation execution into the right contextual pane; execution currently uses the existing full work-area review.
- Removal of the backend's legacy `isMain` concept / migration of existing “Main investigation” names. Explicit findings merge is available from any investigation; it is not automatic consolidation.
- Repository-wide code-content search, output experiments, or accept/integrate operations.
- Final brand approval or a custom outlined wordmark. The new SVG is an implementation asset, not an externally approved brand master.

Do not mark the complete production acceptance checklist as satisfied based on this UI pass.

## Validation

- `npm run build`
- `npm test` (including a regression guard against reintroducing component override CSS)
- `scripts/check-paper-ui.ts`: repeatable Chromium browser checks at 1536×1024 and 390×844 using an intercepted illustrative fixture, not fabricated production records. Checks output/file/diff switching, investigation/output synchronization, keyboard resizing, account settings, responsive pane switching, no page overflow, and no runtime errors. `PLAYWRIGHT_EXECUTABLE_PATH` supports an existing Chromium binary; `JOVE_UI_URL` selects the running Vite instance.
- Before/after migration screenshots retain the same desktop pane widths (238px / 604.8px / 649.2px) and 20px Geist work title. These checks do not claim pixel-exact parity with the conceptual mockup.
