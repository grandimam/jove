# Jove — Paper Design System & Workspace UI Specification

**Version:** 1.0  
**Status:** Design baseline / implementation specification  
**Product:** Jove — investigation-first software engineering environment  
**Tagline:** Explore possibilities. Engineer outcomes.  
**Visual theme:** Paper (light)  
**Primary users:** Software engineers

> This document is the implementation source of truth. The generated mockup is a visual concept, **not** an exact rendering of fonts, icons, code changes, or application state.

---

## 1. Product principles

Jove enables developers to investigate a work objective from multiple independent perspectives, generate an output for each investigation, and implement one output or consolidate selected outputs into a single reviewed implementation.

**Primary mental model:** `Project → Work → Investigations → Outputs → Implementations`.

- **Project:** A local repository/codebase.
- **Work:** An engineering objective; owns investigations and implementation attempts.
- **Investigation:** Independent conversation/context/model, potentially delegated from another investigation.
- **Output:** Versioned findings or proposed solution belonging to an investigation. An output need not contain code.
- **Consolidated output:** Work-level snapshot synthesized from selected investigation outputs; never overwrites originals.
- **Implementation attempt:** Actual code changes and verification in an isolated environment, from a specific output version.

**Keep the visible workflow simple:** Work → Investigate → Implement.

### Non-negotiable interaction rules

1. No permanent **Home** or **Knowledge** sidebar items. The last workspace opens by default; knowledge is retrieved contextually and through search.
2. Settings are accessible through the account menu; avoid a redundant permanent navigation section.
3. Sidebar contains **Projects** and **Work** only. Investigations live in tabs, **not** a duplicated sidebar list.
4. Switching an investigation tab switches the **conversation and its Output** together.
5. The default `General` investigation has no special authority. It does not automatically absorb others' findings.
6. Each investigation can have **zero or one current output**, with version history. Work may contain many outputs.
7. **Clip to…** excludes the source investigation, preserving source references and not triggering an automatic response.
8. **Implement** defaults to the current investigation's output; the dropdown allows **Implement with others…**.
9. Multi-output implementation first synthesizes a **consolidated Work-level output**, detects material conflicts, then requests approval before writing code.
10. Independent implementation attempts have separate Git working copies. Changes are never silently merged into the original checkout.
11. A **proposed diff** is not an applied change. No claims of passing tests without execution and recorded results.
12. One active writer per isolated implementation environment. Executing untrusted code requires an actual sandbox/container or VM; a worktree alone is not a security boundary.

---

## 2. Brand identity

### 2.1 Name and wordmark

- Visible name: **jove** (lowercase).
- Wordmark construction: custom-adjusted **Geist Semibold**, starting at 26 px in primary branding; optical kerning should be tuned in vector artwork.
- Wordmark color: `--ink-strong` (`#232522`).
- Minimum clear space around logo: one-half the height of the raven symbol.
- Do not use colored glow, gradients, cartoon outlines or decorative shadows.

### 2.2 Raven mark

A custom **monochrome geometric raven** is the brand symbol. The generated raven is **reference imagery**, not an approved vector logo.

Deliver final vector variants:

- Full horizontal lockup: raven + `jove` wordmark.
- Standalone 24 px raven icon.
- Small simplified 16 px raven glyph for assistant messages and toolbar.
- Single-color dark-on-paper and reversed light-on-dark variants.

Requirements:

- Distinct silhouette, sharp but nonaggressive beak, simplified wing/body mass.
- Consistent silhouette across 16, 24 and 48 px variants.
- Use in top-left brand and assistant identity; do **not** repeat oversized decorative ravens in conversation.
- All brand assets must be designed as real vector/SVG assets before production.

---

## 3. Color tokens — Paper

The product is predominantly warm neutral. Lilac is for interaction emphasis; mint/amber/red/blue have semantic jobs. Colored file/project icons are **not** arbitrary category decoration.

### 3.1 Foundations

| Token | Hex | Usage |
|---|---|---|
| `--canvas` | `#F4F3EF` | Primary application background |
| `--surface` | `#FFFFFF` | Chat, editor, output surfaces |
| `--surface-subtle` | `#F8F7F3` | Controls, subdued backgrounds |
| `--surface-muted` | `#EAE9E4` | Sidebar, selected neutral areas |
| `--border` | `#D5D4CD` | Panel and control borders |
| `--border-soft` | `#E7E5DF` | Lightweight dividers |
| `--ink-strong` | `#232522` | Main text, primary controls |
| `--ink` | `#40443F` | Ordinary labels and body |
| `--ink-secondary` | `#62645E` | Secondary content |
| `--ink-muted` | `#777A72` | Metadata and placeholders |

### 3.2 Interaction and semantic colors

| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#635BFF` | Focus ring, selected indication, links used sparingly |
| `--accent-soft` | `#E8E6FA` | Selected tabs, user chat tint |
| `--accent-ink` | `#4840A0` | Text over lilac surfaces |
| `--success` | `#27835B` | Verified success |
| `--success-soft` | `#DDF1E5` | Passed-test backgrounds |
| `--warning` | `#996315` | Conflicts, pending human decisions |
| `--warning-soft` | `#FAEBD2` | Warning surfaces |
| `--danger` | `#B04740` | Failures and destructive states |
| `--danger-soft` | `#F8E0DE` | Diff removals, error backgrounds |
| `--info` | `#346893` | Informational/file references |
| `--info-soft` | `#E2EDF8` | Inspection/tool activity |
| `--diff-add-bg` | `#E4F4E8` | Added code lines |
| `--diff-add-ink` | `#217245` | Added code text/markers |
| `--diff-remove-bg` | `#FCE8E6` | Removed code lines |
| `--diff-remove-ink` | `#B04740` | Removed code text/markers |

**Use contrast-tested variants where needed to meet WCAG AA.** Status meaning must never be represented by hue alone; combine icon, label and/or textual state.

### 3.3 Usage proportions

- Roughly 80–90% of visible interface: warm neutral surfaces and typography.
- Lilac: current selection, user chat background, focus and primary interactive cues.
- Mint: **only confirmed** successful actions or checks.
- Amber: unresolved conflicts and warnings.
- Red: errors, failed tests, deletions.
- Blue: informational references and active tool activity.
- Primary **Implement** button is graphite (`#232522`) with white text, not bright blue.

---

## 4. Typography

**UI:** Geist (regular, medium, semibold).  
**Code:** Geist Mono (regular, medium).  
Use real licensed/open-source distributable packages in the app; do not rely on a generated image's font approximation.

| Role | Family | Size | Weight | Line height |
|---|---|---:|---:|---:|
| Logo wordmark | Geist | 26px | 600 | 30px |
| Work title | Geist | 20px | 600 | 28px |
| Screen heading | Geist | 18px | 600 | 26px |
| Panel title | Geist | 14px | 600 | 20px |
| Navigation | Geist | 13px | 500 | 20px |
| Investigation text | Geist | 14px | 400 | 23px |
| Buttons/labels | Geist | 13px | 500 | 18px |
| Secondary text | Geist | 12px | 400 | 18px |
| Metadata | Geist | 11px | 400 | 16px |
| Code/diff | Geist Mono | 13px | 400 | 20px |
| Terminal | Geist Mono | 12px | 400 | 19px |

Rules:

- Use bold sparingly; dense blocks of semibold reduce scanning efficiency.
- Long investigation replies: maximum comfortable prose width approximately 68–78 characters, excluding code blocks.
- Use `font-variant-numeric: tabular-nums` for timestamps, counts, durations, diff line numbers and test results.
- Use sentence case for panel headings and controls; uppercase only for small navigational section labels.
- File paths and code snippets are Geist Mono; surrounding metadata stays Geist.

---

## 5. Iconography

**Library:** Lucide, pinned to a known version for implementation.  
**Default:** 16 px, 1.75 px stroke, outline, color `--ink-secondary`.  
**Compact:** 14 px. **Toolbar:** 18 px.  
Brand raven is a **custom asset** and is never substituted with the generic Lucide Bird icon in production.

| Concept | Icon key | Notes |
|---|---|---|
| Projects category | `blocks` | The concept of a software system |
| Individual project | Custom monogram or neutral `blocks` | Uniform treatment; no random colors |
| Work | `layers-3` | All Work rows use the same icon |
| Investigation | `scan-search` | Consistent across tabs |
| Fork | `git-fork` | Start a new investigation from selected context |
| Clip | `corner-up-right` | Transfer finding to another investigation |
| Output | `file-text` | Investigation artifact |
| Consolidate | `git-compare-arrows` | Only as contextual action, not global nav |
| Implement | `play` | Label must accompany icon |
| Attempt history | `history` | Work-level history |
| Diff | `file-diff` | Proposed vs actual clearly labeled |
| Test candidate | `flask-conical` | Experimental run |
| Terminal | `terminal` | Execution output |
| Pause | `pause` | Stop at safe boundary |
| Search | `search` | Global command search |
| Settings | `settings-2` | In account popover |
| File | `file-code-2` | Generic code asset |
| Expand / collapse | `chevron-down`, `chevron-right` | Standard disclosure |

Avoid emoji, inconsistent filled icons, decorative icon badges, and mixing icon families on the same surface. File-type colors may be introduced only if they add actual recognition value and remain restrained.

---

## 6. Spacing, radii, borders and depth

### Spacing scale

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |

### Geometry

- Control height: 30px (compact), 34px (default), 40px (large).
- Investigation tabs: 34–36px high.
- Sidebar rows: 34–38px high.
- Primary panel padding: 16–20px; code viewers use their own editor gutters.
- Radii: `6px` small, `8px` controls, `10px` panels, `12px` popovers, `14px` app frame.
- Borders: 1px `--border`; interior separators `--border-soft`.
- Shadows: soft, wide and low-opacity, mostly for menus and floating panels. Avoid shadow on every message/card.

### Depth layering

1. App canvas `--canvas`.
2. Sidebar and background chrome `--surface-muted` / `--surface-subtle`.
3. Main working panes `--surface`.
4. Floating menus `--surface` with soft shadow and `--border`.
5. Selection/focus state: lilac fill/indicator, no bright gradient.

---

## 7. Workspace layout

**Desktop: three primary regions, resizable.** No permanent fourth utility column.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ jove                     Project / Work                 Search   Controls   │
├────────────────┬──────────────────────────────────┬────────────────────────┤
│ PROJECTS       │ General  Security  Architecture +│ Output Files Diff ...  │
│ Jove           ├──────────────────────────────────┤                        │
│ Faz            │ Investigation conversation       │ Selected investigation │
│ Karak          │                                  │ output                 │
│ Mitti          │ Findings, clips, delegations     │                        │
│                │                                  │ Proposed files / diff  │
│ WORK · JOVE    │                                  │                        │
│ Add auth       │                                  │                        │
│ Onboarding     │                                  │                        │
│ Refactor Git   ├──────────────────────────────────┤                        │
│                │ Chat composer / model            │ [Test] [Implement ▾]   │
│ Account        │                                  │                        │
└────────────────┴──────────────────────────────────┴────────────────────────┘
```

### Initial dimensions

- Header: 48–52px.
- Navigation sidebar: 224–248px, collapsible.
- Center investigation pane: remaining flexible width, target 45–50% of content area.
- Right output pane: target 42–48% of content area; minimum about 360px.
- Resizable divider hit area: minimum 6px.
- On narrow windows, replace split view with a focusable single-pane mode; do not crush code to unreadable widths.

### Left: navigation

- Raven + `jove` header.
- Projects heading + add button.
- Project rows: consistent neutral `blocks`/monograms.
- Work heading for selected project + add button.
- Work rows: consistent `layers-3` icon, selection on lilac-tinted background.
- Account menu at bottom, containing Settings, provider management, shortcuts, theme and sign-out if relevant.
- No permanent Home/Knowledge/Settings nav items.

### Center: investigation

- Tabs for independent investigations, with small consistent investigation icon.
- `General` is default only, not a parent or super-investigation.
- Assistant messages predominantly unboxed editorial text.
- User messages lightly lilac-tinted, distinguishable but not oversaturated.
- Tool activity presented as compact collapsible summaries.
- Findings include clickable source file references and line ranges.
- `Clip to…` excludes the active investigation.
- `Investigate separately` forks selected text into a new investigation.
- Delegated investigations show status as lightweight inline activity and also appear as normal tabs.
- Composer pinned to bottom; model selector belongs to the active investigation.

### Right: contextual pane

**Investigation mode:** `Output | Files | Diff | History` as appropriate.

- Output title and source investigation shown explicitly.
- Findings/approach, relevant changes and constraints.
- File list marked **Proposed**; do not use `Modified` / `New` before actual changes exist unless describing the intended operation and explicitly labeled as proposed.
- Code preview shown only if actual candidate patch is generated. Otherwise show a change plan.
- Primary action `Implement ▾`.
- Secondary `Test output` only if experiment capability is configured and approved.

**Implementation mode:** `Activity | Diff | Files | Tests | Terminal`.

- Real changed files and Git diff.
- Execution progress, pause/interrupt/resume controls.
- Tests labeled Not run, Running, Passed, Failed or Skipped based on actual verification.
- Accept action only after a completed attempt is available and changes can be reviewed.

---

## 8. Component specifications

### 8.1 Buttons

- **Primary:** graphite background `#232522`, white text, 8px radius, minimum 34px height; focus ring via `--accent`.
- **Secondary:** Paper/white surface, border `--border`, dark text.
- **Ghost:** transparent; hover uses `--surface-muted`.
- **Danger:** only destructive confirmations, not ordinary Stop/Pause.
- Disabled: lower contrast, noninteractive; retain visible text.
- Include keyboard shortcuts in tooltips where appropriate.

### 8.2 Tabs

- Active: gentle lilac `--accent-soft`, dark text and 2px accent underline or left edge.
- Inactive: neutral surface and muted text.
- Close action appears on hover/focus and is keyboard accessible.
- Tabs are for investigation navigation only; don't duplicate them in sidebar.

### 8.3 Chat

- User message background: `--accent-soft`; radius 10px; max text width suited to prose.
- Assistant response: no default card; metadata separated by typographic hierarchy.
- Structured findings: subtle bordered cards only when content benefits from a container.
- Tool activity: small neutral row with running/complete/failed state.
- Code excerpts use Geist Mono and syntax highlighting, not body font.

### 8.4 Output

- Header: `Output · General` and version `v3` (illustrative).
- Content may be findings-only or proposed changes.
- When no output exists: clear empty state, `Develop output` contextual action.
- Version history preserves meaningful revisions without rewriting past conversations.
- Every output references its investigation and source context.

### 8.5 File list and diff

- Code file names always monospaced.
- Proposed file intent: `Proposed · modify`, `Proposed · add`, or similar.
- Actual file state after execution: `Modified`, `Added`, `Deleted`.
- Split and unified diff toggle.
- Line numbers tabular and aligned.
- Added/removed backgrounds use semantic colors only for real or explicitly **preview** code patches.
- Allow opening a file at exact line and contextual `Investigate this change`.

### 8.6 Status

- `Investigating`: lilac/blue active indication; not success green.
- `Output ready`: neutral or subtle positive cue, **not** test-passed.
- `Running`: spinner/activity icon plus text.
- `Not run`: neutral, not a checkmark.
- `Passed`: green plus text/check.
- `Failed`: red plus text/error icon.
- `Conflict`: amber plus explanatory text and resolution action.
- `Interrupted`: neutral warning plus resume affordance.

---

## 9. Consolidated implementation flow

### Single investigation

1. Developer selects an investigation tab.
2. Right pane shows its latest output.
3. Developer clicks **Implement**.
4. Jove prepares a handoff from that exact output version.
5. Developer approves objective, constraints and execution permissions.
6. An isolated implementation attempt starts.
7. Right pane switches to real execution activity/diff/tests.

### Multiple investigations

1. Developer clicks **Implement ▾ → Implement with others…**.
2. A compact contextual picker lists investigations and their output versions; current investigation selected by default.
3. Developer selects additional outputs.
4. Jove synthesizes a **new consolidated Work-level output** (not another investigation).
5. Jove highlights mutually incompatible decisions; material conflicts require review.
6. Developer reviews/approves the consolidated output and execution settings.
7. An isolated implementation attempt runs from the approved snapshot.
8. Originals remain unchanged and inspectable.

### Multiple completed implementations

This is a distinct **integration** operation, not output consolidation. It must be done using a fresh isolated integration attempt with conflict handling and combined verification. Do not imply independently passing tests guarantee a successful integration.

---

## 10. Accessibility and engineering fidelity

- Target WCAG 2.2 AA for interactive elements and text contrast.
- Minimum interactive hit target approximately 32px for dense desktop controls; larger where feasible.
- All workflows must be keyboard accessible; visible focus state in lilac with adequate contrast.
- Do not make success/error rely solely on color.
- Respect reduced-motion preference.
- Persist navigation, pane widths, active tabs and collapsed states.
- Screen-reader labels for icon-only controls.
- Never display fabricated statuses: generated UI mocks may illustrate states, but production must bind them to real records.
- Use exact typeface and vector icon assets in code; generated mockups do not establish font fidelity or icon path correctness.

---

## 11. Core design tokens (CSS starter)

```css
:root {
  color-scheme: light;
  --canvas: #f4f3ef;
  --surface: #ffffff;
  --surface-subtle: #f8f7f3;
  --surface-muted: #eae9e4;
  --border: #d5d4cd;
  --border-soft: #e7e5df;
  --ink-strong: #232522;
  --ink: #40443f;
  --ink-secondary: #62645e;
  --ink-muted: #777a72;
  --accent: #635bff;
  --accent-soft: #e8e6fa;
  --accent-ink: #4840a0;
  --success: #27835b;
  --success-soft: #ddf1e5;
  --warning: #996315;
  --warning-soft: #faebd2;
  --danger: #b04740;
  --danger-soft: #f8e0de;
  --info: #346893;
  --info-soft: #e2edf8;
  --diff-add-bg: #e4f4e8;
  --diff-add-ink: #217245;
  --diff-remove-bg: #fce8e6;
  --diff-remove-ink: #b04740;
  --font-ui: "Geist", system-ui, sans-serif;
  --font-code: "Geist Mono", ui-monospace, monospace;
  --radius-control: 8px;
  --radius-panel: 10px;
  --shadow-popover: 0 12px 36px rgb(25 28 20 / 10%);
}
```

---

## 12. Production acceptance checklist

- [ ] Custom raven SVG + simplified small-size variant approved.
- [ ] Wordmark optically adjusted and stored as an actual brand asset.
- [ ] Geist and Geist Mono loaded explicitly; fallback behavior tested.
- [ ] Lucide icons pinned, semantic mapping reviewed and rendered consistently.
- [ ] Three resizable panes; no duplicate investigation navigation.
- [ ] Default investigation is not automatically privileged.
- [ ] Current investigation and Output always remain in sync.
- [ ] Findings-only investigations work without fabricated code candidate.
- [ ] Proposed vs actual changes have unambiguous UI labels.
- [ ] No tests are marked passed unless recorded as executed/passed.
- [ ] Implement single output and Implement with others flows reviewed.
- [ ] Consolidation detects conflicting decisions and retains provenance.
- [ ] Implementation attempts are isolated and inspectable.
- [ ] Accessible keyboard navigation, focus and reduced-motion support.
- [ ] Responsive/narrow-window behavior tested with real code samples.

---

## 13. Mockup fidelity notes

The accompanying rendered image is useful for composition, palette, and overall atmosphere. It is **not** reliable for precise brand vectors, exact Geist font appearance, Git diff syntax, simulated test execution, or consistent iconography. In particular:

- The mockup's rendered raven must be replaced with an approved custom SVG.
- All random colored symbols on project/work rows should be replaced with the semantic icon system above.
- The screenshot may show a green `Ready to implement` label beside proposed code; this must **not** imply verification passed.
- Do not display a proposed patch as a real applied diff without an explicit `Preview` label.
- If an investigation is actively running, its existing output may still be available, but the UI must identify the output's exact version and update time.

**Design goal:** An engineering instrument that feels focused, legible, warm and tactile—not a generic AI dashboard.
